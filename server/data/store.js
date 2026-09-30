const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'db.json');

// Initial seed data
const initialData = {
  users: [
    { id: 'user_emp_1', name: 'Omkar Dev', email: 'omkar@nexus.ai', role: 'Employee', department: 'Engineering', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'user_mgr_1', name: 'Sarah Connor', email: 'sarah.mgr@nexus.ai', role: 'Manager', department: 'Engineering', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'user_fin_1', name: 'Vikram Mehta', email: 'vikram.fin@nexus.ai', role: 'Finance', department: 'Finance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'user_hr_1', name: 'Priya Sharma', email: 'priya.hr@nexus.ai', role: 'HR', department: 'People Operations', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { id: 'user_it_1', name: 'Alex Rivera', email: 'alex.it@nexus.ai', role: 'IT', department: 'IT Support', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'user_adm_1', name: 'Elena Rostova', email: 'elena.admin@nexus.ai', role: 'Admin', department: 'Executive Operations', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
  ],
  workflows: [
    {
      id: 'wf_seed_1',
      title: 'Ergonomic 4K UltraWide Monitor for Engineering',
      type: 'approval',
      status: 'pending_approval',
      priority: 'normal',
      creator: { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering' },
      department: 'Engineering',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      ai_data: {
        amount: 35000,
        currency: 'INR',
        category: 'Equipment',
        reason: 'Development workstation setup and multi-screen productivity',
        department: 'Engineering',
        recommended_route: 'Manager Approval -> IT Provisioning',
        risk_flags: [],
        confidence: 0.96
      },
      current_step: 'Manager Approval',
      steps: [
        { id: 'step_1', name: 'AI Intake & Verification', status: 'completed', completedAt: new Date(Date.now() - 3600000 * 4).toISOString(), actor: 'Central AI Engine' },
        { id: 'step_2', name: 'Manager Approval', status: 'in_progress', completedAt: null, actor: 'Sarah Connor (Manager)' },
        { id: 'step_3', name: 'Procurement & IT Fulfillment', status: 'pending', completedAt: null, actor: 'IT Support' },
        { id: 'step_4', name: 'Asset Dispatch & Setup', status: 'pending', completedAt: null, actor: 'Omkar Dev' }
      ],
      approvals: [
        {
          id: 'app_seed_1',
          stepName: 'Manager Approval',
          approverRole: 'Manager',
          approverName: 'Sarah Connor',
          status: 'pending',
          decision: null,
          comments: null,
          requestedAt: new Date(Date.now() - 3600000 * 3.5).toISOString()
        }
      ],
      tasks: [
        { id: 'tsk_seed_1', title: 'Verify budget allocation under Q3 Dev Tools', status: 'pending', assignee: 'Sarah Connor', role: 'Manager', dueDate: new Date(Date.now() + 86400000 * 2).toISOString() },
        { id: 'tsk_seed_2', title: 'Issue PO & Arrange delivery', status: 'pending', assignee: 'IT Support', role: 'IT', dueDate: new Date(Date.now() + 86400000 * 5).toISOString() }
      ],
      activity_logs: [
        { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), actor: 'Omkar Dev', action: 'Submitted natural language request', details: 'I need a ₹35,000 monitor for my development work.' },
        { timestamp: new Date(Date.now() - 3600000 * 3.9).toISOString(), actor: 'Central AI', action: 'Classified workflow as AI ApprovalFlow', details: 'Extracted amount: ₹35,000, Category: Equipment, Priority: Normal' },
        { timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(), actor: 'Workflow Engine', action: 'Routed approval request to Sarah Connor', details: 'Notification dispatched via Internal Channel' }
      ]
    },
    {
      id: 'wf_seed_2',
      title: 'Mumbai Client Visit Travel & Dining Expense',
      type: 'expense',
      status: 'pending_approval',
      priority: 'normal',
      creator: { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering' },
      department: 'Engineering',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      ai_data: {
        amount: 2850,
        currency: 'INR',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        category: 'Travel & Meals',
        purpose: 'Client technical kickoff meeting at Mumbai BKC Office',
        policy_checks: {
          within_daily_allowance: true,
          receipt_attached: true,
          per_diem_cap: '₹5,000'
        },
        risk_flags: [],
        confidence: 0.98
      },
      current_step: 'Manager Approval',
      steps: [
        { id: 'step_1', name: 'AI Policy & Receipt Verification', status: 'completed', completedAt: new Date(Date.now() - 3600000 * 12).toISOString(), actor: 'Central AI Engine' },
        { id: 'step_2', name: 'Manager Approval', status: 'in_progress', completedAt: null, actor: 'Sarah Connor (Manager)' },
        { id: 'step_3', name: 'Finance Disbursement', status: 'pending', completedAt: null, actor: 'Vikram Mehta (Finance)' }
      ],
      approvals: [
        {
          id: 'app_seed_2',
          stepName: 'Manager Approval',
          approverRole: 'Manager',
          approverName: 'Sarah Connor',
          status: 'pending',
          decision: null,
          comments: null,
          requestedAt: new Date(Date.now() - 3600000 * 11.5).toISOString()
        }
      ],
      tasks: [
        { id: 'tsk_seed_3', title: 'Verify client project billing code', status: 'pending', assignee: 'Sarah Connor', role: 'Manager', dueDate: new Date(Date.now() + 86400000).toISOString() },
        { id: 'tsk_seed_4', title: 'Process direct deposit reimbursement', status: 'pending', assignee: 'Vikram Mehta', role: 'Finance', dueDate: new Date(Date.now() + 86400000 * 3).toISOString() }
      ],
      activity_logs: [
        { timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), actor: 'Omkar Dev', action: 'Submitted expense claim', details: 'I spent ₹2,850 during yesterday\'s Mumbai client visit.' },
        { timestamp: new Date(Date.now() - 3600000 * 11.9).toISOString(), actor: 'Central AI', action: 'Policy Check Passed', details: 'Amount ₹2,850 is within the ₹5,000 travel threshold' }
      ]
    },
    {
      id: 'wf_seed_3',
      title: 'Urgent Wi-Fi Outage in Conference Room B',
      type: 'helpdesk',
      status: 'in_progress',
      priority: 'critical',
      creator: { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering' },
      department: 'IT',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      ai_data: {
        department: 'IT',
        category: 'Network & Connectivity',
        issue: 'Laptop Wi-Fi disconnected before crucial client presentation in 20 mins',
        sla_minutes: 20,
        sla_deadline: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
        impact: 'High - Client facing meeting at risk',
        recommended_action: 'Direct access point reboot and temporary 5G hotspot allocation',
        risk_flags: ['Approaching SLA breach in 5 mins', 'Client presentation blocked'],
        confidence: 0.99
      },
      current_step: 'IT Rapid Resolution',
      steps: [
        { id: 'step_1', name: 'AI Incident Triage & SLA Priority Tagging', status: 'completed', completedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), actor: 'Central AI' },
        { id: 'step_2', name: 'IT Rapid Resolution', status: 'in_progress', completedAt: null, actor: 'Alex Rivera (IT)' },
        { id: 'step_3', name: 'Incident Post-Mortem & Close', status: 'pending', completedAt: null, actor: 'Alex Rivera' }
      ],
      approvals: [],
      tasks: [
        { id: 'tsk_seed_5', title: 'Deploy backup Wi-Fi mesh dongle to Conf Room B', status: 'completed', assignee: 'Alex Rivera', role: 'IT', dueDate: new Date(Date.now() + 1000 * 60 * 5).toISOString() },
        { id: 'tsk_seed_6', title: 'Cycle AP controller channel frequencies', status: 'pending', assignee: 'Alex Rivera', role: 'IT', dueDate: new Date(Date.now() + 1000 * 60 * 10).toISOString() }
      ],
      activity_logs: [
        { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), actor: 'Omkar Dev', action: 'Reported critical outage', details: 'My laptop Wi-Fi is not working and I have a client presentation in 20 minutes.' },
        { timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(), actor: 'Central AI', action: 'Classified SLA: 20 mins (Critical Severity)', details: 'Triggered immediate paging to Alex Rivera (IT)' }
      ]
    },
    {
      id: 'wf_seed_4',
      title: 'Employee Onboarding: Rahul Sharma (Software Intern)',
      type: 'onboarding',
      status: 'in_progress',
      priority: 'high',
      creator: { id: 'user_hr_1', name: 'Priya Sharma', role: 'HR', department: 'People Operations' },
      department: 'Engineering',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      ai_data: {
        name: 'Rahul Sharma',
        role: 'Software Intern',
        department: 'Engineering',
        joining_date: '2026-10-10',
        manager: 'Sarah Connor',
        buddy: 'Omkar Dev',
        confidence: 0.97
      },
      current_step: 'IT Provisioning & Workspace Setup',
      steps: [
        { id: 'step_1', name: 'Candidate Profile & HR Compliance', status: 'completed', completedAt: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Priya Sharma (HR)' },
        { id: 'step_2', name: 'IT Provisioning & Workspace Setup', status: 'in_progress', completedAt: null, actor: 'Alex Rivera (IT)' },
        { id: 'step_3', name: 'Team Introduction & Mentorship Pairing', status: 'pending', completedAt: null, actor: 'Sarah Connor (Manager)' },
        { id: 'step_4', name: 'First-Week Check-in & Review', status: 'pending', completedAt: null, actor: 'Priya Sharma (HR)' }
      ],
      approvals: [],
      tasks: [
        { id: 'tsk_seed_7', title: 'Create Google Workspace & GitHub accounts for Rahul', status: 'completed', assignee: 'Alex Rivera', role: 'IT', dueDate: new Date(Date.now() + 86400000 * 2).toISOString() },
        { id: 'tsk_seed_8', title: 'Prepare development MacBook M3 Pro', status: 'in_progress', assignee: 'Alex Rivera', role: 'IT', dueDate: new Date(Date.now() + 86400000 * 3).toISOString() },
        { id: 'tsk_seed_9', title: 'Schedule 1-on-1 welcome lunch with Engineering team', status: 'pending', assignee: 'Sarah Connor', role: 'Manager', dueDate: new Date(Date.now() + 86400000 * 8).toISOString() },
        { id: 'tsk_seed_10', title: 'Conduct Week 1 feedback milestone', status: 'pending', assignee: 'Priya Sharma', role: 'HR', dueDate: new Date(Date.now() + 86400000 * 15).toISOString() }
      ],
      activity_logs: [
        { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Priya Sharma', action: 'Initiated Onboarding Intake', details: 'Rahul Sharma is joining Engineering as a Software Intern on October 10.' },
        { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'Central AI', action: 'Generated 4 dynamic onboarding milestones and 4 action tasks', details: 'Tailored for Software Intern role in Engineering' }
      ]
    },
    {
      id: 'wf_seed_5',
      title: 'Q4 Product Roadmap Sync — Action Execution',
      type: 'meetingops',
      status: 'in_progress',
      priority: 'high',
      creator: { id: 'user_mgr_1', name: 'Sarah Connor', role: 'Manager', department: 'Engineering' },
      department: 'Engineering',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      ai_data: {
        transcript_snippet: 'Omkar will finish the API by Friday. Priya will prepare the presentation. Rahul will contact the client tomorrow.',
        key_decisions: ['API freeze by Friday COB', 'Client presentation prep underway', 'External kickoff with client tomorrow'],
        tasks_extracted: 3,
        confidence: 0.99
      },
      current_step: 'Action Items in Execution',
      steps: [
        { id: 'step_1', name: 'Transcript Ingestion & AI Entity Parsing', status: 'completed', completedAt: new Date(Date.now() - 3600000 * 5).toISOString(), actor: 'Central AI' },
        { id: 'step_2', name: 'Action Items in Execution', status: 'in_progress', completedAt: null, actor: 'Engineering & HR Team' },
        { id: 'step_3', name: 'Sprint Review Verification', status: 'pending', completedAt: null, actor: 'Sarah Connor (Manager)' }
      ],
      approvals: [],
      tasks: [
        { id: 'tsk_seed_11', title: 'Finish and document the Core API endpoints', status: 'in_progress', assignee: 'Omkar Dev', role: 'Employee', dueDate: '2026-10-03T18:00:00.000Z' },
        { id: 'tsk_seed_12', title: 'Prepare the executive stakeholder slide presentation', status: 'pending', assignee: 'Priya Sharma', role: 'HR', dueDate: '2026-10-02T17:00:00.000Z' },
        { id: 'tsk_seed_13', title: 'Contact the Mumbai client account team for integration signoff', status: 'pending', assignee: 'Rahul Sharma', role: 'Employee', dueDate: '2026-10-01T12:00:00.000Z' }
      ],
      activity_logs: [
        { timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), actor: 'Sarah Connor', action: 'Pasted Meeting Notes', details: 'Parsed 3 actionable commitments from meeting notes' },
        { timestamp: new Date(Date.now() - 3600000 * 4.9).toISOString(), actor: 'Central AI', action: 'Created 3 live assignable tasks', details: 'Owners mapped to Omkar, Priya, and Rahul with automated deadlines' }
      ]
    }
  ],
  monitor_alerts: [
    {
      id: 'alert_1',
      workflowId: 'wf_seed_3',
      workflowTitle: 'Urgent Wi-Fi Outage in Conference Room B',
      type: 'sla_breach_warning',
      severity: 'critical',
      message: 'Critical IT ticket approaching 20-minute SLA deadline (5 mins remaining)',
      suggestedAction: 'Escalate to Senior Network Admin / Deploy backup 5G Hotspot',
      status: 'active',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
      id: 'alert_2',
      workflowId: 'wf_seed_1',
      workflowTitle: 'Ergonomic 4K UltraWide Monitor for Engineering',
      type: 'pending_approval_sla',
      severity: 'warning',
      message: 'Equipment request awaiting Sarah Connor review for > 3 hours',
      suggestedAction: 'Send automated Slack/Email reminder to Manager',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'alert_3',
      workflowId: 'wf_seed_4',
      workflowTitle: 'Employee Onboarding: Rahul Sharma',
      type: 'upcoming_milestone',
      severity: 'info',
      message: 'IT equipment preparation due in 3 days before start date (Oct 10)',
      suggestedAction: 'Notify IT warehouse to stage MacBook Pro',
      status: 'active',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]
};

// In-memory data store with file sync
let db = { ...initialData };

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(content);
    } else {
      saveData();
    }
  } catch (err) {
    console.error('Error loading DB, using in-memory state:', err);
  }
}

function saveData() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Initialize
loadData();

module.exports = {
  getUsers: () => db.users,
  getUserById: (id) => db.users.find(u => u.id === id),
  getUserByRole: (role) => db.users.find(u => u.role.toLowerCase() === role.toLowerCase()),
  
  getWorkflows: () => db.workflows,
  getWorkflowById: (id) => db.workflows.find(w => w.id === id),
  
  saveWorkflow: (wf) => {
    const index = db.workflows.findIndex(w => w.id === wf.id);
    if (index >= 0) {
      db.workflows[index] = { ...wf, updatedAt: new Date().toISOString() };
    } else {
      db.workflows.unshift(wf);
    }
    saveData();
    return wf;
  },

  getAllTasks: () => {
    const tasks = [];
    db.workflows.forEach(wf => {
      if (wf.tasks && Array.isArray(wf.tasks)) {
        wf.tasks.forEach(t => {
          tasks.push({
            ...t,
            workflowId: wf.id,
            workflowTitle: wf.title,
            workflowType: wf.type,
            workflowPriority: wf.priority
          });
        });
      }
    });
    return tasks;
  },

  updateTaskStatus: (workflowId, taskId, status) => {
    const wf = db.workflows.find(w => w.id === workflowId);
    if (!wf) return null;
    const task = (wf.tasks || []).find(t => t.id === taskId);
    if (!task) return null;
    task.status = status;
    task.completedAt = status === 'completed' ? new Date().toISOString() : null;
    
    // Log activity
    wf.activity_logs.unshift({
      timestamp: new Date().toISOString(),
      actor: 'Task Assignee',
      action: `Updated task status to ${status}`,
      details: task.title
    });
    
    wf.updatedAt = new Date().toISOString();
    saveData();
    return { workflow: wf, task };
  },

  getAllApprovals: () => {
    const approvals = [];
    db.workflows.forEach(wf => {
      if (wf.approvals && Array.isArray(wf.approvals)) {
        wf.approvals.forEach(a => {
          approvals.push({
            ...a,
            workflowId: wf.id,
            workflowTitle: wf.title,
            workflowType: wf.type,
            workflowPriority: wf.priority,
            creator: wf.creator,
            amount: wf.ai_data?.amount,
            createdAt: wf.createdAt
          });
        });
      }
    });
    return approvals;
  },

  getMonitorAlerts: () => db.monitor_alerts,
  
  addMonitorAlert: (alert) => {
    const newAlert = {
      id: `alert_${uuidv4().substring(0, 8)}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      ...alert
    };
    db.monitor_alerts.unshift(newAlert);
    saveData();
    return newAlert;
  },

  resolveMonitorAlert: (alertId, resolutionDetails) => {
    const alert = db.monitor_alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date().toISOString();
      alert.resolutionDetails = resolutionDetails;
      saveData();
    }
    return alert;
  },

  resetToSeed: () => {
    db = JSON.parse(JSON.stringify(initialData));
    saveData();
    return db;
  }
};
