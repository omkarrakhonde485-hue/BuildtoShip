const express = require('express');
const router = express.Router();
const store = require('../data/store');
const geminiService = require('../services/geminiService');
const workflowEngine = require('../services/workflowEngine');

// Health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NEXUS AI Control Center Backend', timestamp: new Date().toISOString() });
});

// Users / Roles
router.get('/users', (req, res) => {
  res.json(store.getUsers());
});

// AI Intake Parsing
router.post('/ai/intake', async (req, res) => {
  try {
    const { prompt, user } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiResult = await geminiService.analyzeIntakeWithGemini(prompt, user || {});
    res.json({ success: true, analysis: aiResult });
  } catch (err) {
    console.error('AI intake error:', err);
    res.status(500).json({ error: 'Failed to analyze request with AI', details: err.message });
  }
});

// Create Workflow
router.post('/workflows', (req, res) => {
  try {
    const { aiResult, user } = req.body;
    if (!aiResult) {
      return res.status(400).json({ error: 'aiResult payload is required' });
    }
    const creator = user || { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering' };
    const workflow = workflowEngine.createWorkflowFromIntake(aiResult, creator);
    res.status(201).json({ success: true, workflow });
  } catch (err) {
    console.error('Workflow creation error:', err);
    res.status(500).json({ error: 'Failed to create workflow', details: err.message });
  }
});

// Get Workflows (Role & Query Aware)
router.get('/workflows', (req, res) => {
  try {
    const { role, department, type, status, search } = req.query;
    let workflows = store.getWorkflows();

    if (role && role !== 'Admin') {
      // Role filtering rules:
      if (role === 'Employee') {
        // Employee sees own workflows or workflows in department
        workflows = workflows.filter(w => w.creator?.id === 'user_emp_1' || w.creator?.role === 'Employee');
      } else if (role === 'Manager') {
        // Manager sees workflows requiring approval or in department
        workflows = workflows.filter(w => w.department === 'Engineering' || (w.approvals && w.approvals.some(a => a.approverRole === 'Manager')));
      } else if (role === 'Finance') {
        workflows = workflows.filter(w => w.type === 'expense' || (w.ai_data && w.ai_data.amount));
      } else if (role === 'HR') {
        workflows = workflows.filter(w => w.type === 'onboarding');
      } else if (role === 'IT') {
        workflows = workflows.filter(w => w.type === 'helpdesk' || (w.steps && w.steps.some(s => s.actor.includes('IT'))));
      }
    }

    if (type) {
      workflows = workflows.filter(w => w.type.toLowerCase() === type.toLowerCase());
    }

    if (status) {
      workflows = workflows.filter(w => w.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      workflows = workflows.filter(w => 
        w.title.toLowerCase().includes(q) || 
        w.type.toLowerCase().includes(q) ||
        (w.creator && w.creator.name.toLowerCase().includes(q))
      );
    }

    res.json(workflows);
  } catch (err) {
    console.error('Get workflows error:', err);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
});

// Get Workflow by ID
router.get('/workflows/:id', (req, res) => {
  const wf = store.getWorkflowById(req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  res.json(wf);
});

// Approve Workflow
router.post('/workflows/:id/approve', (req, res) => {
  try {
    const { approvalId, comments, user } = req.body;
    const approver = user || { id: 'user_mgr_1', name: 'Sarah Connor', role: 'Manager' };
    const updatedWf = workflowEngine.processApproval(req.params.id, approvalId, approver, 'approved', comments);
    res.json({ success: true, workflow: updatedWf });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Reject Workflow
router.post('/workflows/:id/reject', (req, res) => {
  try {
    const { approvalId, comments, user } = req.body;
    const approver = user || { id: 'user_mgr_1', name: 'Sarah Connor', role: 'Manager' };
    const updatedWf = workflowEngine.processApproval(req.params.id, approvalId, approver, 'rejected', comments);
    res.json({ success: true, workflow: updatedWf });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Advance Workflow Step
router.post('/workflows/:id/advance', (req, res) => {
  try {
    const { user, stepName } = req.body;
    const actor = user || { name: 'System Operator' };
    const updatedWf = workflowEngine.advanceWorkflow(req.params.id, actor, stepName);
    res.json({ success: true, workflow: updatedWf });
  } catch (err) {
    console.error('Advance error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Tasks Endpoints
router.get('/tasks', (req, res) => {
  try {
    const { role, user } = req.query;
    let tasks = store.getAllTasks();

    if (role && role !== 'Admin') {
      tasks = tasks.filter(t => t.role.toLowerCase() === role.toLowerCase() || (user && t.assignee.toLowerCase().includes(user.toLowerCase())));
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks/:id/toggle', (req, res) => {
  try {
    const { workflowId, status } = req.body;
    const result = store.updateTaskStatus(workflowId, req.params.id, status || 'completed');
    if (!result) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Approvals Endpoints
router.get('/approvals', (req, res) => {
  try {
    const { role } = req.query;
    let approvals = store.getAllApprovals();

    if (role && role !== 'Admin') {
      approvals = approvals.filter(a => a.approverRole.toLowerCase() === role.toLowerCase());
    }

    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// AI Operations Monitor Events & Metrics
router.get('/monitor/events', (req, res) => {
  try {
    const alerts = store.getMonitorAlerts();
    const workflows = store.getWorkflows();
    const tasks = store.getAllTasks();

    const metrics = {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(w => w.status === 'in_progress' || w.status === 'pending_approval').length,
      pendingApprovals: workflows.flatMap(w => w.approvals || []).filter(a => a.status === 'pending').length,
      criticalIncidents: workflows.filter(w => w.type === 'helpdesk' && w.priority === 'critical' && w.status !== 'completed').length,
      activeOnboardings: workflows.filter(w => w.type === 'onboarding' && w.status !== 'completed').length,
      completedWorkflows: workflows.filter(w => w.status === 'completed').length,
      openTasks: tasks.filter(t => t.status !== 'completed').length,
      slaComplianceRate: '98.4%'
    };

    res.json({ alerts, metrics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monitor status' });
  }
});

// Resolve Alert
router.post('/monitor/resolve', (req, res) => {
  try {
    const { alertId, resolution } = req.body;
    const alert = store.resolveMonitorAlert(alertId, resolution || 'Auto-resolved via AI Operations Agent');
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// External Integration Webhook Simulation / Make.com trigger
router.post('/integrations/make-webhook', (req, res) => {
  try {
    const { workflowId, eventType, recipientEmail } = req.body;
    const wf = store.getWorkflowById(workflowId);
    
    const notificationPayload = {
      event: eventType || 'APPROVAL_REQUESTED',
      timestamp: new Date().toISOString(),
      recipient: recipientEmail || 'sarah.mgr@nexus.ai',
      workflow: {
        id: wf?.id || 'wf_demo',
        title: wf?.title || 'Expense & Equipment Authorization',
        amount: wf?.ai_data?.amount,
        priority: wf?.priority
      },
      status: 'DISPATCHED_TO_GMAIL_VIA_MAKE'
    };

    if (wf) {
      wf.activity_logs.unshift({
        timestamp: new Date().toISOString(),
        actor: 'Make.com Automation',
        action: `Triggered Gmail Notification: ${eventType}`,
        details: `Dispatched to ${recipientEmail || 'sarah.mgr@nexus.ai'}`
      });
      store.saveWorkflow(wf);
    }

    res.json({ success: true, automationResult: notificationPayload });
  } catch (err) {
    res.status(500).json({ error: 'Integration trigger failed' });
  }
});

// Reset Demo Data
router.post('/demo/reset', (req, res) => {
  store.resetToSeed();
  res.json({ success: true, message: 'NEXUS AI Database reset to fresh seed demo state.' });
});

module.exports = router;
