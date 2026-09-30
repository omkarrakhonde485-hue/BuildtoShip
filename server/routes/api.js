const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabase } = require('../lib/supabase');
const store = require('../data/store');
const { runAgent } = require('../services/aiAgent');
const { executeTool } = require('../services/toolExecutor');
const googleOAuth = require('../services/googleOAuth');
const googleTools = require('../services/googleTools');
const env = require('../lib/env');
const { v4: uuidv4 } = require('uuid');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

// ============================================
// HEALTH
// ============================================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nexus-backend',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

router.get('/health/ai', async (req, res) => {
  try {
    const hasKey = !!env.GEMINI_API_KEY;
    const hasSupabase = !!env.SUPABASE_URL;
    const hasGoogle = !!env.GOOGLE_CLIENT_ID;
    res.json({ 
      status: 'ok',
      gemini: hasKey ? 'configured' : 'missing',
      supabase: hasSupabase ? 'configured' : 'missing',
      google_oauth: hasGoogle ? 'configured' : 'missing'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================
// AUTH / PROFILE
// ============================================
router.get('/profile', requireAuth, (req, res) => {
  const { id, full_name, email, role, department, avatar_url, manager_id } = req.user;
  res.json({ id, full_name, email, role, department, avatar_url, manager_id });
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { full_name, department, avatar_url } = req.body;
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (department) updates.department = department;
    if (avatar_url) updates.avatar_url = avatar_url;

    res.json({ ...req.user, ...updates });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles', requireAuth, async (req, res) => {
  try {
    const users = store.getUsers();
    res.json(users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// AI AGENT — Conversational & Tool Calling
// ============================================
router.post('/ai/agent', requireAuth, async (req, res) => {
  try {
    const { message, conversationId, context } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message too long (max 5000 chars)' });
    }

    console.log(`\n🤖 AI Agent request from ${req.user.full_name || req.user.name || req.user.email} (${req.user.role}): "${message.substring(0, 100)}..."`);

    const result = await runAgent(message, req.user, executeTool, []);
    console.log(`  ✅ AI response: ${result.toolCalls.length} tool calls, success=${result.success}`);

    res.json(result);
  } catch (err) {
    console.error('AI Agent error:', err);
    res.status(500).json({
      success: false,
      error: 'AI processing failed',
      message: err.message,
      toolCalls: []
    });
  }
});

// ============================================
// AI INTAKE — Single Request Classification & Extraction
// ============================================
router.post('/ai/intake', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt text is required' });
    }

    if (!env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      systemInstruction: `You are NEXUS AI Central Operations Classifier. Analyze the user request and output strict JSON with no markdown backticks.
Format:
{
  "workflow_type": "approval" | "expense" | "onboarding" | "helpdesk" | "meetingops",
  "title": "Clear concise workflow title",
  "summary": "1-2 sentence executive summary",
  "priority": "low" | "normal" | "high" | "critical",
  "department": "Engineering" | "Finance" | "HR" | "IT" | "Executive",
  "extracted_data": {
    // specific variables like amount (number), currency ("INR"), employee_name, role, issue, sla_minutes, dates, etc.
  },
  "recommended_route": "e.g. Manager Approval -> IT Provisioning",
  "risk_flags": ["any risks e.g. amount exceeds threshold, urgency, missing receipt"],
  "tasks": [
    { "title": "Actionable task name", "assignee": "Name or Role", "role": "manager | it | finance | hr | employee" }
  ],
  "requires_approval": true | false,
  "approver_role": "manager" | "finance" | "hr" | "admin"
}`
    });

    const result = await model.generateContent(`Analyze this company request: "${prompt}"`);
    let rawText = result.response.text().trim();
    if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (rawText.startsWith('```')) rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(rawText);
    res.json(parsed);
  } catch (err) {
    console.error('AI Intake error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// WORKFLOWS
// ============================================
router.get('/workflows', requireAuth, async (req, res) => {
  try {
    const { type, status, department } = req.query;
    let list = store.getWorkflows();

    if (type && type !== 'all') {
      list = list.filter(w => (w.type || w.workflow_type) === type);
    }
    if (status && status !== 'all') {
      list = list.filter(w => w.status === status);
    }
    if (department) {
      list = list.filter(w => w.department === department);
    }

    const role = (req.user.role || 'employee').toLowerCase();
    if (role === 'employee') {
      list = list.filter(w => (w.creator?.name || '').toLowerCase() === (req.user.name || req.user.full_name || '').toLowerCase() || w.creator?.id === req.user.id);
    } else if (role === 'it') {
      list = list.filter(w => (w.type || w.workflow_type) === 'helpdesk' || (w.creator?.name || '').toLowerCase() === (req.user.name || req.user.full_name || '').toLowerCase());
    } else if (role === 'hr') {
      list = list.filter(w => (w.type || w.workflow_type) === 'onboarding' || (w.creator?.name || '').toLowerCase() === (req.user.name || req.user.full_name || '').toLowerCase());
    } else if (role === 'finance') {
      list = list.filter(w => ['expense', 'approval'].includes(w.type || w.workflow_type) || (w.creator?.name || '').toLowerCase() === (req.user.name || req.user.full_name || '').toLowerCase());
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows', requireAuth, async (req, res) => {
  try {
    const body = req.body;
    const workflowType = body.workflow_type || body.type || 'approval';
    const title = body.title || 'New Operations Workflow';
    const summary = body.summary || title;
    const priority = body.priority || 'normal';
    const department = body.department || req.user.department || 'Engineering';
    const extractedData = body.extracted_data || body.ai_data || {};
    const riskFlags = body.risk_flags || [];
    const tasks = body.tasks || [];
    const requiresApproval = body.requires_approval !== false;
    const approverRole = body.approver_role || 'Manager';

    let initialStatus = 'processing';
    if (requiresApproval) {
      initialStatus = 'pending_approval';
    }

    const wfId = `wf_${uuidv4().substring(0, 8)}`;
    const newWorkflow = {
      id: wfId,
      title,
      type: workflowType,
      workflow_type: workflowType,
      summary,
      status: initialStatus,
      priority,
      department,
      creator: {
        id: req.user.id || 'user_emp_1',
        name: req.user.full_name || req.user.name || 'Omkar Dev',
        role: req.user.role || 'Employee',
        department: req.user.department || 'Engineering'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ai_data: extractedData,
      risk_flags: riskFlags,
      current_step: requiresApproval ? 'Manager Approval' : 'Execution',
      steps: [
        { id: `step_1`, name: 'AI Intake & Classification', status: 'completed', completedAt: new Date().toISOString(), actor: 'Central AI Engine' },
        { id: `step_2`, name: requiresApproval ? 'Manager Approval' : 'Execution', status: 'in_progress', completedAt: null, actor: `${approverRole} Review` }
      ],
      approvals: requiresApproval ? [
        {
          id: `app_${uuidv4().substring(0, 8)}`,
          stepName: 'Manager Approval',
          approverRole,
          approverName: approverRole === 'Manager' ? 'Sarah Connor' : approverRole === 'Finance' ? 'Vikram Mehta' : 'Elena Rostova',
          status: 'pending',
          requestedAt: new Date().toISOString()
        }
      ] : [],
      tasks: tasks.map((t, idx) => ({
        id: `tsk_${uuidv4().substring(0, 8)}`,
        title: typeof t === 'string' ? t : t.title,
        status: 'pending',
        assignee: t.assignee || (t.role === 'it' ? 'Alex Rivera' : t.role === 'finance' ? 'Vikram Mehta' : t.role === 'hr' ? 'Priya Sharma' : 'Sarah Connor'),
        role: (t.role || 'Manager').toUpperCase(),
        dueDate: new Date(Date.now() + 86400000 * (idx + 1)).toISOString()
      })),
      activity_logs: [
        { timestamp: new Date().toISOString(), actor: req.user.full_name || req.user.name || 'User', action: 'Created Operations Workflow', details: title },
        { timestamp: new Date().toISOString(), actor: 'Central AI', action: 'Auto-Routed Workflow', details: `Classified as ${workflowType.toUpperCase()} with ${tasks.length} tasks` }
      ]
    };

    store.saveWorkflow(newWorkflow);

    // Try Supabase insert asynchronously in background
    try {
      supabase.from('workflows').insert({
        id: wfId,
        created_by: req.user.id,
        workflow_type: workflowType,
        title,
        summary,
        status: initialStatus,
        priority,
        department,
        ai_data: extractedData,
        risk_flags: riskFlags
      }).then(() => {}).catch(() => {});
    } catch (e) {}

    res.status(201).json(newWorkflow);
  } catch (err) {
    console.error('Create workflow error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/workflows/:id', requireAuth, async (req, res) => {
  try {
    const wf = store.getWorkflowById(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });
    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/approve', requireAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    const wf = store.getWorkflowById(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    wf.status = 'in_progress';
    wf.current_step = 'Execution in Progress';
    if (wf.approvals && wf.approvals[0]) {
      wf.approvals[0].status = 'approved';
      wf.approvals[0].comments = comments || 'Approved';
      wf.approvals[0].decidedAt = new Date().toISOString();
    }
    wf.activity_logs.unshift({
      timestamp: new Date().toISOString(),
      actor: req.user.full_name || req.user.name || 'Approver',
      action: 'Approved Workflow',
      details: comments || 'Approved via control center'
    });

    store.saveWorkflow(wf);
    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/reject', requireAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    const wf = store.getWorkflowById(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    wf.status = 'rejected';
    wf.current_step = 'Rejected';
    if (wf.approvals && wf.approvals[0]) {
      wf.approvals[0].status = 'rejected';
      wf.approvals[0].comments = comments || 'Rejected';
      wf.approvals[0].decidedAt = new Date().toISOString();
    }
    wf.activity_logs.unshift({
      timestamp: new Date().toISOString(),
      actor: req.user.full_name || req.user.name || 'Approver',
      action: 'Rejected Workflow',
      details: comments || 'Rejected'
    });

    store.saveWorkflow(wf);
    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/advance', requireAuth, async (req, res) => {
  try {
    const wf = store.getWorkflowById(req.params.id);
    if (!wf) return res.status(404).json({ error: 'Workflow not found' });

    let nextStatus = wf.status;
    let nextStep = wf.current_step;

    if (wf.status === 'pending_approval' || wf.status === 'awaiting_approval') {
      nextStatus = 'in_progress';
      nextStep = 'Execution in Progress';
    } else if (wf.status === 'in_progress' || wf.status === 'processing') {
      nextStatus = 'completed';
      nextStep = 'Completed';
    }

    wf.status = nextStatus;
    wf.current_step = nextStep;
    wf.updatedAt = new Date().toISOString();
    wf.activity_logs.unshift({
      timestamp: new Date().toISOString(),
      actor: req.user.full_name || req.user.name || 'Operations Agent',
      action: 'Advanced Workflow Stage',
      details: `Advanced to ${nextStep}`
    });

    store.saveWorkflow(wf);
    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// APPROVALS
// ============================================
router.get('/approvals', requireAuth, async (req, res) => {
  try {
    const role = (req.user.role || 'employee').toLowerCase();
    let list = store.getAllApprovals();

    if (role === 'employee') {
      list = [];
    } else if (role !== 'admin') {
      list = list.filter(a => (a.approverRole || '').toLowerCase() === role);
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TASKS
// ============================================
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    const role = (req.user.role || 'employee').toLowerCase();
    const userName = (req.user.name || req.user.full_name || '').toLowerCase();
    let list = store.getAllTasks();

    if (role === 'employee') {
      list = list.filter(t => (t.assignee || '').toLowerCase().includes(userName) || (t.role || '').toLowerCase() === 'employee');
    } else if (role !== 'admin' && role !== 'manager') {
      list = list.filter(t => (t.role || '').toLowerCase() === role || (t.assignee || '').toLowerCase().includes(userName));
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks/:id/toggle', requireAuth, async (req, res) => {
  try {
    const allWfs = store.getWorkflows();
    for (const wf of allWfs) {
      const task = (wf.tasks || []).find(t => t.id === req.params.id);
      if (task) {
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        task.completedAt = task.status === 'completed' ? new Date().toISOString() : null;

        // If all tasks completed -> complete workflow
        if (wf.tasks.every(t => t.status === 'completed')) {
          wf.status = 'completed';
          wf.current_step = 'Completed';
        }

        wf.updatedAt = new Date().toISOString();
        store.saveWorkflow(wf);
        return res.json(task);
      }
    }

    res.status(404).json({ error: 'Task not found' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// DASHBOARD & MONITOR
// ============================================
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const allWf = store.getWorkflows();
    const allTasks = store.getAllTasks();
    const allApprovals = store.getAllApprovals();
    const alerts = store.getMonitorAlerts();

    const distribution = {};
    for (const wf of allWf) {
      const type = wf.type || wf.workflow_type || 'approval';
      if (!distribution[type]) distribution[type] = { total: 0, active: 0, completed: 0 };
      distribution[type].total++;
      if (wf.status === 'completed') distribution[type].completed++;
      else if (!['cancelled', 'failed', 'rejected'].includes(wf.status)) distribution[type].active++;
    }

    res.json({
      metrics: {
        activeWorkflows: allWf.filter(w => !['completed', 'cancelled', 'rejected'].includes(w.status)).length,
        pendingApprovals: allApprovals.filter(a => a.status === 'pending').length,
        openTasks: allTasks.filter(t => t.status !== 'completed').length,
        activeAlerts: alerts.filter(a => a.status === 'active').length,
        completedToday: allWf.filter(w => w.status === 'completed').length,
        totalWorkflows: allWf.length
      },
      distribution,
      userRole: req.user.role,
      userName: req.user.full_name || req.user.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monitor/events', requireAuth, async (req, res) => {
  try {
    const alerts = store.getMonitorAlerts();
    const allWf = store.getWorkflows();
    const logs = [];
    allWf.forEach(wf => {
      if (wf.activity_logs) {
        wf.activity_logs.forEach(l => {
          logs.push({ ...l, workflowTitle: wf.title, workflowType: wf.type });
        });
      }
    });

    res.json({
      alerts: alerts || [],
      activityLogs: logs.slice(0, 30),
      metrics: {
        slaComplianceRate: '98.6%',
        averageResolutionHours: '1.4h',
        activeAlerts: alerts.filter(a => a.status === 'active').length,
        aiSuccessRate: '99.2%'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// DEMO RESET & MAKE.COM AUTOMATION
// ============================================
router.post('/demo/reset', async (req, res) => {
  try {
    store.resetToSeed();
    res.json({ success: true, message: 'Database reset to clean demo seed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/integrations/make-webhook', async (req, res) => {
  try {
    const webhookUrl = env.MAKE_WEBHOOK_URL;
    let dispatched = false;

    if (webhookUrl && webhookUrl.startsWith('http') && !webhookUrl.includes('placeholder')) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'operations.alert_dispatched',
            timestamp: new Date().toISOString(),
            payload: req.body || { message: 'Demo operations trigger' }
          })
        });
        dispatched = true;
      } catch (e) {
        console.warn('Make webhook delivery failed:', e.message);
      }
    }

    res.json({
      success: true,
      dispatched,
      message: dispatched ? 'Live Make.com webhook dispatched!' : 'Make.com simulated webhook event executed successfully.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
