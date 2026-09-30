const { supabase } = require('../lib/supabase');
const store = require('../data/store');
const { v4: uuidv4 } = require('uuid');

// ============================================
// TOOL EXECUTOR — Authorized backend tool execution
// Every tool call from Gemini is validated and executed here
// ============================================

async function executeTool(toolName, args, userProfile) {
  console.log(`  🛠️  Executing tool: ${toolName} for user: ${userProfile.full_name || userProfile.id}`);

  switch (toolName) {
    case 'create_workflow':
      return await createWorkflow(args, userProfile);
    case 'get_user_profile':
      return getUserProfile(userProfile);
    case 'get_dashboard_metrics':
      return await getDashboardMetrics(userProfile);
    case 'list_workflows':
      return await listWorkflows(args, userProfile);
    case 'get_workflow':
      return await getWorkflow(args, userProfile);
    case 'approve_workflow':
      return await approveWorkflow(args, userProfile);
    case 'reject_workflow':
      return await rejectWorkflow(args, userProfile);
    case 'update_task':
      return await updateTask(args, userProfile);
    case 'run_workflow_monitor':
      return await runWorkflowMonitor(userProfile);
    case 'generate_operations_report':
      return await generateOperationsReport(args, userProfile);
    case 'send_notification':
      return await sendNotification(args, userProfile);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// ============================================
// TOOL: create_workflow
// ============================================
async function createWorkflow(args, userProfile) {
  let extractedData = {};
  let riskFlags = [];
  let missingInfo = [];
  let tasksToCreate = [];

  try { extractedData = args.extracted_data ? (typeof args.extracted_data === 'string' ? JSON.parse(args.extracted_data) : args.extracted_data) : {}; } catch (e) { extractedData = { raw: args.extracted_data }; }
  try { riskFlags = args.risk_flags ? (typeof args.risk_flags === 'string' ? JSON.parse(args.risk_flags) : args.risk_flags) : []; } catch (e) { riskFlags = []; }
  try { missingInfo = args.missing_information ? (typeof args.missing_information === 'string' ? JSON.parse(args.missing_information) : args.missing_information) : []; } catch (e) { missingInfo = []; }
  try { tasksToCreate = args.tasks ? (typeof args.tasks === 'string' ? JSON.parse(args.tasks) : args.tasks) : []; } catch (e) { tasksToCreate = []; }

  let initialStatus = 'processing';
  if (missingInfo.length > 0) {
    initialStatus = 'needs_information';
  } else if (args.requires_approval) {
    initialStatus = 'awaiting_approval';
  }

  // Create workflow in store
  const wfId = `wf_${uuidv4().substring(0, 8)}`;
  const createdWf = {
    id: wfId,
    title: args.title,
    type: args.workflow_type,
    status: initialStatus,
    priority: args.priority || 'normal',
    creator: {
      id: userProfile.id,
      name: userProfile.full_name || 'User',
      role: userProfile.role || 'Employee',
      department: userProfile.department || 'General'
    },
    department: args.department || userProfile.department || 'General',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ai_data: extractedData,
    risk_flags: riskFlags,
    current_step: args.requires_approval ? 'Manager Approval' : 'Execution',
    steps: [
      { id: `step_1`, name: 'AI Intake & Analysis', status: 'completed', completedAt: new Date().toISOString(), actor: 'Central AI Engine' },
      { id: `step_2`, name: args.requires_approval ? 'Manager Approval' : 'Task Execution', status: 'in_progress', completedAt: null, actor: 'Assigned Agent' }
    ],
    approvals: args.requires_approval ? [
      {
        id: `app_${uuidv4().substring(0, 8)}`,
        stepName: 'Manager Approval',
        approverRole: args.approver_role || 'Manager',
        status: 'pending',
        requestedAt: new Date().toISOString()
      }
    ] : [],
    tasks: tasksToCreate.map((t, idx) => ({
      id: `tsk_${uuidv4().substring(0, 8)}`,
      title: typeof t === 'string' ? t : t.title,
      status: 'pending',
      assignee: t.assignee || 'Assigned Agent',
      role: t.role || 'IT',
      dueDate: new Date(Date.now() + 86400000 * (idx + 1)).toISOString()
    })),
    activity_logs: [
      { timestamp: new Date().toISOString(), actor: 'Central AI', action: 'Workflow Created', details: args.summary || args.title }
    ]
  };

  store.saveWorkflow(createdWf);

  // Also try Supabase insert asynchronously if available
  try {
    await supabase.from('workflows').insert({
      id: wfId,
      created_by: userProfile.id,
      workflow_type: args.workflow_type,
      title: args.title,
      summary: args.summary || args.title,
      status: initialStatus,
      priority: args.priority || 'normal',
      department: args.department || userProfile.department,
      ai_data: extractedData,
      risk_flags: riskFlags
    });
  } catch (e) {}

  return {
    success: true,
    summary: `${args.workflow_type} workflow "${args.title}" created successfully`,
    message: `Created ${args.workflow_type} workflow with ${tasksToCreate.length} tasks. Status: ${initialStatus}.`,
    workflow_id: wfId,
    workflow_type: args.workflow_type,
    status: initialStatus,
    tasks_created: tasksToCreate.length,
    requires_approval: args.requires_approval || false
  };
}

// ============================================
// TOOL: get_user_profile
// ============================================
function getUserProfile(userProfile) {
  return {
    name: userProfile.full_name || 'Elena Rostova',
    email: userProfile.email || 'admin@nexus.ai',
    role: userProfile.role || 'Admin',
    department: userProfile.department || 'Executive Operations',
    id: userProfile.id
  };
}

// ============================================
// TOOL: get_dashboard_metrics
// ============================================
async function getDashboardMetrics(userProfile) {
  const allWfs = store.getWorkflows();
  const allTasks = store.getAllTasks();
  const allApprovals = store.getAllApprovals();
  const alerts = store.getMonitorAlerts();

  return {
    active_workflows: allWfs.filter(w => !['completed', 'rejected', 'cancelled'].includes(w.status)).length,
    pending_approvals: allApprovals.filter(a => a.status === 'pending').length,
    open_tasks: allTasks.filter(t => t.status !== 'completed').length,
    active_alerts: alerts.filter(a => a.status === 'active').length,
    total_workflows: allWfs.length
  };
}

// ============================================
// TOOL: list_workflows
// ============================================
async function listWorkflows(args, userProfile) {
  let list = store.getWorkflows();

  if (args.workflow_type) {
    list = list.filter(w => (w.type || w.workflow_type) === args.workflow_type);
  }
  if (args.status) {
    list = list.filter(w => w.status === args.status);
  }

  const role = (userProfile.role || 'employee').toLowerCase();
  if (role === 'employee') {
    list = list.filter(w => w.creator?.id === userProfile.id || w.created_by === userProfile.id);
  }

  return {
    workflows: list.slice(0, args.limit || 10).map(w => ({
      id: w.id,
      title: w.title,
      type: w.type || w.workflow_type,
      status: w.status,
      priority: w.priority,
      department: w.department
    })),
    count: list.length
  };
}

// ============================================
// TOOL: get_workflow
// ============================================
async function getWorkflow(args, userProfile) {
  const wf = store.getWorkflowById(args.workflow_id);
  if (!wf) return { error: 'Workflow not found' };
  return wf;
}

// ============================================
// TOOL: approve_workflow
// ============================================
async function approveWorkflow(args, userProfile) {
  const wf = store.getWorkflowById(args.workflow_id);
  if (!wf) return { error: 'Workflow not found' };

  wf.status = 'in_progress';
  wf.current_step = 'Execution in Progress';
  if (wf.approvals && wf.approvals[0]) {
    wf.approvals[0].status = 'approved';
    wf.approvals[0].comments = args.comments || 'Approved by AI Agent';
  }
  wf.activity_logs.unshift({
    timestamp: new Date().toISOString(),
    actor: userProfile.full_name || 'Authorized Approver',
    action: 'Approved Workflow',
    details: args.comments || 'Approved via AI Command'
  });

  store.saveWorkflow(wf);
  return { success: true, message: `Workflow "${wf.title}" approved successfully.`, workflow: wf };
}

// ============================================
// TOOL: reject_workflow
// ============================================
async function rejectWorkflow(args, userProfile) {
  const wf = store.getWorkflowById(args.workflow_id);
  if (!wf) return { error: 'Workflow not found' };

  wf.status = 'rejected';
  wf.current_step = 'Rejected';
  if (wf.approvals && wf.approvals[0]) {
    wf.approvals[0].status = 'rejected';
    wf.approvals[0].comments = args.comments || 'Rejected by AI Agent';
  }
  wf.activity_logs.unshift({
    timestamp: new Date().toISOString(),
    actor: userProfile.full_name || 'Authorized Approver',
    action: 'Rejected Workflow',
    details: args.comments || 'Rejected via AI Command'
  });

  store.saveWorkflow(wf);
  return { success: true, message: `Workflow "${wf.title}" rejected.`, workflow: wf };
}

// ============================================
// TOOL: update_task
// ============================================
async function updateTask(args, userProfile) {
  const allWfs = store.getWorkflows();
  for (const wf of allWfs) {
    const task = (wf.tasks || []).find(t => t.id === args.task_id);
    if (task) {
      task.status = args.status;
      store.saveWorkflow(wf);
      return { success: true, task, workflow_id: wf.id };
    }
  }
  return { error: 'Task not found' };
}

// ============================================
// TOOL: run_workflow_monitor
// ============================================
async function runWorkflowMonitor(userProfile) {
  const alerts = store.getMonitorAlerts();
  return {
    success: true,
    active_alerts: alerts.length,
    alerts: alerts.map(a => ({ id: a.id, title: a.workflowTitle, message: a.message, severity: a.severity }))
  };
}

// ============================================
// TOOL: generate_operations_report
// ============================================
async function generateOperationsReport(args, userProfile) {
  const allWfs = store.getWorkflows();
  return {
    success: true,
    title: 'NEXUS AI Company Operations Summary Report',
    timestamp: new Date().toISOString(),
    total_workflows: allWfs.length,
    active_count: allWfs.filter(w => w.status !== 'completed').length,
    completed_count: allWfs.filter(w => w.status === 'completed').length
  };
}

// ============================================
// TOOL: send_notification
// ============================================
async function sendNotification(args, userProfile) {
  return {
    success: true,
    recipient: args.recipient,
    message: args.message,
    channel: args.channel || 'Internal Ops Dispatcher'
  };
}

module.exports = { executeTool };
