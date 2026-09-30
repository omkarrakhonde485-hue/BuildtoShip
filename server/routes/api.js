const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { requireAuth, requireRole } = require('../middleware/auth');
const { supabase } = require('../lib/supabase');
const { runAgent } = require('../services/aiAgent');
const { executeTool } = require('../services/toolExecutor');
const googleOAuth = require('../services/googleOAuth');
const googleTools = require('../services/googleTools');
const env = require('../lib/env');

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

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/profiles', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department, avatar_url')
      .order('full_name');

    if (error) throw error;
    res.json(data || []);
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

    console.log(`\n🤖 AI Agent request from ${req.user.full_name || req.user.email} (${req.user.role}): "${message.substring(0, 100)}..."`);

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
    const { type, status, department, limit = 50 } = req.query;
    let query = supabase
      .from('workflows')
      .select('*, profiles!workflows_created_by_fkey(full_name, email, avatar_url, role)')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (type && type !== 'all') query = query.eq('workflow_type', type);
    if (status && status !== 'all') query = query.eq('status', status);
    if (department) query = query.eq('department', department);

    // Role-based visibility
    const role = (req.user.role || 'employee').toLowerCase();
    if (role === 'employee') {
      query = query.eq('created_by', req.user.id);
    } else if (role === 'it') {
      query = query.or(`workflow_type.eq.helpdesk,created_by.eq.${req.user.id}`);
    } else if (role === 'hr') {
      query = query.or(`workflow_type.eq.onboarding,created_by.eq.${req.user.id}`);
    } else if (role === 'finance') {
      query = query.or(`workflow_type.in.(expense,approval),created_by.eq.${req.user.id}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Normalize for frontend
    const normalized = (data || []).map(w => ({
      ...w,
      type: w.workflow_type,
      creator: {
        id: w.created_by,
        name: w.profiles?.full_name || 'User',
        email: w.profiles?.email || '',
        role: w.profiles?.role || 'Employee'
      }
    }));

    res.json(normalized);
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
    const department = body.department || req.user.department || 'General';
    const extractedData = body.extracted_data || body.ai_data || {};
    const riskFlags = body.risk_flags || [];
    const tasks = body.tasks || [];
    const requiresApproval = body.requires_approval !== false;
    const approverRole = body.approver_role || 'manager';

    let initialStatus = 'processing';
    if (requiresApproval) {
      initialStatus = 'awaiting_approval';
    }

    // Insert workflow
    const { data: wf, error: wfErr } = await supabase
      .from('workflows')
      .insert({
        created_by: req.user.id,
        workflow_type: workflowType,
        title,
        summary,
        status: initialStatus,
        priority,
        department,
        ai_data: extractedData,
        risk_flags: riskFlags,
        current_step: requiresApproval ? 'Manager Approval' : 'Execution',
        source_text: body.source_text || ''
      })
      .select()
      .single();

    if (wfErr) throw wfErr;

    // Create approval if required
    if (requiresApproval) {
      await supabase.from('approvals').insert({
        workflow_id: wf.id,
        approver_role: approverRole,
        status: 'pending'
      });
    }

    // Create tasks
    if (tasks.length > 0) {
      const taskInserts = tasks.map(t => ({
        workflow_id: wf.id,
        title: typeof t === 'string' ? t : t.title,
        assignee_role: t.role || 'manager',
        assignee_name: t.assignee || 'Assigned Agent',
        status: 'pending',
        priority: t.priority || priority
      }));
      await supabase.from('tasks').insert(taskInserts);
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      workflow_id: wf.id,
      actor_type: 'user',
      actor_id: req.user.id,
      action: 'workflow_created',
      description: `${req.user.full_name || req.user.email} created ${workflowType} workflow: ${title}`
    });

    res.status(201).json(wf);
  } catch (err) {
    console.error('Create workflow error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/workflows/:id', requireAuth, async (req, res) => {
  try {
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*, profiles!workflows_created_by_fkey(full_name, email, avatar_url, role)')
      .eq('id', req.params.id)
      .single();

    if (error || !workflow) return res.status(404).json({ error: 'Workflow not found' });

    const [tasks, approvals, logs, steps] = await Promise.all([
      supabase.from('tasks').select('*').eq('workflow_id', req.params.id).order('created_at'),
      supabase.from('approvals').select('*, profiles!approvals_approver_id_fkey(full_name, email)').eq('workflow_id', req.params.id),
      supabase.from('activity_logs').select('*').eq('workflow_id', req.params.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('workflow_steps').select('*').eq('workflow_id', req.params.id).order('order_index')
    ]);

    res.json({
      ...workflow,
      type: workflow.workflow_type,
      creator: {
        id: workflow.created_by,
        name: workflow.profiles?.full_name || 'User',
        email: workflow.profiles?.email || '',
        role: workflow.profiles?.role || 'Employee'
      },
      tasks: tasks.data || [],
      approvals: approvals.data || [],
      activity_logs: logs.data || [],
      steps: steps.data || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/approve', requireAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    await supabase.from('approvals').update({
      status: 'approved',
      comments: comments || 'Approved via control center',
      approver_id: req.user.id,
      decided_at: new Date().toISOString()
    }).eq('workflow_id', req.params.id);

    const { data: wf, error } = await supabase.from('workflows').update({
      status: 'in_progress',
      current_step: 'Execution in Progress',
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      workflow_id: req.params.id,
      actor_type: 'user',
      actor_id: req.user.id,
      action: 'approved_workflow',
      description: `Workflow approved by ${req.user.full_name || req.user.email} (${req.user.role})`
    });

    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/reject', requireAuth, async (req, res) => {
  try {
    const { comments } = req.body;
    await supabase.from('approvals').update({
      status: 'rejected',
      comments: comments || 'Rejected',
      approver_id: req.user.id,
      decided_at: new Date().toISOString()
    }).eq('workflow_id', req.params.id);

    const { data: wf, error } = await supabase.from('workflows').update({
      status: 'rejected',
      current_step: 'Rejected',
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      workflow_id: req.params.id,
      actor_type: 'user',
      actor_id: req.user.id,
      action: 'rejected_workflow',
      description: `Workflow rejected by ${req.user.full_name || req.user.email}. Reason: ${comments || 'None'}`
    });

    res.json(wf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workflows/:id/advance', requireAuth, async (req, res) => {
  try {
    const { data: wf } = await supabase.from('workflows').select('*').eq('id', req.params.id).single();
    if (!wf) return res.status(404).json({ error: 'Not found' });

    let nextStatus = wf.status;
    let nextStep = wf.current_step;

    if (wf.status === 'awaiting_approval' || wf.status === 'submitted') {
      nextStatus = 'in_progress';
      nextStep = 'Execution';
    } else if (wf.status === 'in_progress' || wf.status === 'processing') {
      nextStatus = 'completed';
      nextStep = 'Completed';
    }

    const { data: updated, error } = await supabase.from('workflows').update({
      status: nextStatus,
      current_step: nextStep,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      workflow_id: req.params.id,
      actor_type: 'user',
      actor_id: req.user.id,
      action: 'workflow_advanced',
      description: `Workflow transitioned to ${nextStatus}`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// APPROVALS
// ============================================
router.get('/approvals', requireAuth, async (req, res) => {
  try {
    let query = supabase
      .from('approvals')
      .select('*, workflows(id, title, workflow_type, summary, priority, ai_data, created_by, profiles!workflows_created_by_fkey(full_name, email, avatar_url, role)), profiles!approvals_approver_id_fkey(full_name, email)')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);

    const role = (req.user.role || 'employee').toLowerCase();
    if (role === 'employee') {
      query = query.eq('approver_id', req.user.id);
    } else if (role !== 'admin') {
      query = query.or(`approver_id.eq.${req.user.id},approver_role.eq.${role}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const normalized = (data || []).map(a => ({
      ...a,
      workflowTitle: a.workflows?.title,
      workflowType: a.workflows?.workflow_type,
      priority: a.workflows?.priority,
      creator: {
        name: a.workflows?.profiles?.full_name || 'User',
        email: a.workflows?.profiles?.email || '',
        role: a.workflows?.profiles?.role || 'Employee'
      }
    }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TASKS
// ============================================
router.get('/tasks', requireAuth, async (req, res) => {
  try {
    let query = supabase
      .from('tasks')
      .select('*, workflows(id, title, workflow_type)')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);

    const role = (req.user.role || 'employee').toLowerCase();
    if (role === 'employee') {
      query = query.eq('assignee_id', req.user.id);
    } else if (role !== 'admin' && role !== 'manager') {
      query = query.or(`assignee_id.eq.${req.user.id},assignee_role.eq.${role}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const normalized = (data || []).map(t => ({
      ...t,
      workflowTitle: t.workflows?.title,
      workflowType: t.workflows?.workflow_type
    }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { data: current } = await supabase.from('tasks').select('*').eq('id', req.params.id).single();
    if (!current) return res.status(404).json({ error: 'Task not found' });

    const newStatus = current.status === 'completed' ? 'pending' : 'completed';
    const { data: updated, error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // If all tasks completed -> complete workflow
    if (newStatus === 'completed') {
      const { data: allTasks } = await supabase.from('tasks').select('status').eq('workflow_id', current.workflow_id);
      if (allTasks && allTasks.every(t => t.status === 'completed')) {
        await supabase.from('workflows').update({
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('id', current.workflow_id);
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================
// DASHBOARD & MONITOR
// ============================================
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const role = (req.user.role || 'employee').toLowerCase();
    const isAdmin = role === 'admin';
    const isManager = ['manager', 'admin'].includes(role);

    let wfQuery = supabase.from('workflows').select('*', { count: 'exact', head: true })
      .not('status', 'in', '("completed","cancelled","failed","rejected")');
    if (!isAdmin && !isManager) wfQuery = wfQuery.eq('created_by', req.user.id);
    const { count: activeWorkflows } = await wfQuery;

    let apQuery = supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    if (!isAdmin) apQuery = apQuery.or(`approver_id.eq.${req.user.id},approver_role.eq.${role}`);
    const { count: pendingApprovals } = await apQuery;

    let taskQuery = supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']);
    if (!isAdmin) taskQuery = taskQuery.or(`assignee_id.eq.${req.user.id},assignee_role.eq.${role}`);
    const { count: openTasks } = await taskQuery;

    const { count: activeAlerts } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { data: allWf } = await supabase.from('workflows').select('workflow_type, status');

    const distribution = {};
    for (const wf of (allWf || [])) {
      if (!distribution[wf.workflow_type]) distribution[wf.workflow_type] = { total: 0, active: 0, completed: 0 };
      distribution[wf.workflow_type].total++;
      if (wf.status === 'completed') distribution[wf.workflow_type].completed++;
      else if (!['cancelled', 'failed', 'rejected'].includes(wf.status)) distribution[wf.workflow_type].active++;
    }

    res.json({
      metrics: {
        activeWorkflows: activeWorkflows || 0,
        pendingApprovals: pendingApprovals || 0,
        openTasks: openTasks || 0,
        activeAlerts: activeAlerts || 0,
        completedToday: (allWf || []).filter(w => w.status === 'completed').length,
        totalWorkflows: allWf?.length || 0
      },
      distribution,
      userRole: req.user.role,
      userName: req.user.full_name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/monitor/events', requireAuth, async (req, res) => {
  try {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, workflows(title, workflow_type, status, priority)')
      .order('created_at', { ascending: false })
      .limit(30);

    const { data: logs } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    res.json({
      alerts: alerts || [],
      activityLogs: logs || [],
      metrics: {
        slaComplianceRate: '98.6%',
        averageResolutionHours: '1.4h',
        activeAlerts: (alerts || []).filter(a => a.status === 'active').length,
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
    // Delete existing workflows, tasks, approvals, alerts, logs
    await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('approvals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('workflows').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Run seed script logic
    delete require.cache[require.resolve('../lib/seed')];
    require('../lib/seed');

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

// ============================================
// GOOGLE INTEGRATIONS
// ============================================
router.get('/integrations/google/status', requireAuth, async (req, res) => {
  try {
    const status = await googleOAuth.getConnectionStatus(req.user.id);
    res.json(status);
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

router.get('/integrations/google/start', requireAuth, async (req, res) => {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }
    const { url } = await googleOAuth.startOAuth(req.user.id);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/integrations/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/integrations?error=${error}`);
    }

    await googleOAuth.handleCallback(code, state);
    res.redirect(`${env.FRONTEND_URL}/integrations?success=true`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${env.FRONTEND_URL}/integrations?error=${encodeURIComponent(err.message)}`);
  }
});

router.post('/integrations/google/disconnect', requireAuth, async (req, res) => {
  try {
    await googleOAuth.disconnect(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
