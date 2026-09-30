import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const ROLES = [
  { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering', title: 'Senior Software Engineer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80' },
  { id: 'user_mgr_1', name: 'Sarah Connor', role: 'Manager', department: 'Engineering', title: 'Engineering Director', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' },
  { id: 'user_fin_1', name: 'Vikram Mehta', role: 'Finance', department: 'Finance', title: 'Finance Controller', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
  { id: 'user_hr_1', name: 'Priya Sharma', role: 'HR', department: 'People Operations', title: 'Head of People & Talent', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80' },
  { id: 'user_it_1', name: 'Alex Rivera', role: 'IT', department: 'IT Support', title: 'Lead Systems Architect', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
  { id: 'user_adm_1', name: 'Elena Rostova', role: 'Admin', department: 'Executive Operations', title: 'Chief Operating Officer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' }
];

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(ROLES[0]);
  const [workflows, setWorkflows] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [monitorData, setMonitorData] = useState({ alerts: [], metrics: {} });
  const [loading, setLoading] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [notification, setNotification] = useState(null);

  // Show temporary toast notification
  const showToast = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(prev => (prev?.id === prev?.id ? null : prev));
    }, 4000);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      const [wfRes, tskRes, appRes, monRes] = await Promise.all([
        fetch(`/api/workflows?role=${currentUser.role}`),
        fetch(`/api/tasks?role=${currentUser.role}&user=${currentUser.name}`),
        fetch(`/api/approvals?role=${currentUser.role}`),
        fetch('/api/monitor/events')
      ]);

      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (tskRes.ok) setTasks(await tskRes.json());
      if (appRes.ok) setApprovals(await appRes.json());
      if (monRes.ok) setMonitorData(await monRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [currentUser]);

  // AI Intake Analysis
  const analyzeIntake = async (prompt) => {
    const res = await fetch('/api/ai/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, user: currentUser })
    });
    if (!res.ok) throw new Error('AI analysis failed');
    const data = await res.json();
    return data.analysis;
  };

  // Launch New Workflow from AI
  const createWorkflowFromAi = async (aiResult) => {
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aiResult, user: currentUser })
    });
    if (!res.ok) throw new Error('Workflow creation failed');
    const data = await res.json();
    showToast(`Workflow "${data.workflow.title}" launched successfully!`, 'success');
    await refreshAll();
    setSelectedWorkflow(data.workflow);
    return data.workflow;
  };

  // Approve Workflow
  const approveWorkflow = async (workflowId, approvalId, comments = '') => {
    const res = await fetch(`/api/workflows/${workflowId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId, comments, user: currentUser })
    });
    if (!res.ok) throw new Error('Approval action failed');
    const data = await res.json();
    showToast(`Workflow approved by ${currentUser.name}`, 'success');
    await refreshAll();
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(data.workflow);
    }
    return data.workflow;
  };

  // Reject Workflow
  const rejectWorkflow = async (workflowId, approvalId, comments = '') => {
    const res = await fetch(`/api/workflows/${workflowId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId, comments, user: currentUser })
    });
    if (!res.ok) throw new Error('Rejection action failed');
    const data = await res.json();
    showToast(`Workflow rejected with comments: "${comments || 'None'}"`, 'warning');
    await refreshAll();
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(data.workflow);
    }
    return data.workflow;
  };

  // Advance Workflow Step
  const advanceWorkflow = async (workflowId) => {
    const res = await fetch(`/api/workflows/${workflowId}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser })
    });
    if (!res.ok) throw new Error('Failed to advance step');
    const data = await res.json();
    showToast(`Advanced workflow to: ${data.workflow.current_step}`, 'info');
    await refreshAll();
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(data.workflow);
    }
    return data.workflow;
  };

  // Toggle Task Completion
  const toggleTask = async (workflowId, taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const res = await fetch(`/api/tasks/${taskId}/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowId, status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update task');
    const data = await res.json();
    showToast(`Task marked as ${newStatus}`, 'info');
    await refreshAll();
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(data.workflow);
    }
    return data;
  };

  // Resolve Monitor Alert
  const resolveAlert = async (alertId, resolution) => {
    const res = await fetch('/api/monitor/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, resolution })
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    showToast('AI Operations Alert resolved and auto-healed', 'success');
    await refreshAll();
  };

  // Trigger External Make.com / Email Automation
  const triggerMakeAutomation = async (workflowId, eventType = 'APPROVAL_DISPATCH') => {
    const res = await fetch('/api/integrations/make-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflowId: workflowId || workflows[0]?.id,
        eventType,
        recipientEmail: currentUser.email
      })
    });
    const data = await res.json();
    showToast(`Dispatched to Make.com & Gmail: ${eventType}`, 'success');
    await refreshAll();
    return data;
  };

  // Reset Demo Data
  const resetDemoData = async () => {
    await fetch('/api/demo/reset', { method: 'POST' });
    showToast('NEXUS Operations DB reset to pristine state', 'info');
    await refreshAll();
  };

  const switchRole = (userId) => {
    const target = ROLES.find(r => r.id === userId);
    if (target) {
      setCurrentUser(target);
      showToast(`Switched active view to: ${target.name} (${target.role})`, 'info');
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      switchRole,
      workflows,
      tasks,
      approvals,
      monitorData,
      loading,
      selectedWorkflow,
      setSelectedWorkflow,
      analyzeIntake,
      createWorkflowFromAi,
      approveWorkflow,
      rejectWorkflow,
      advanceWorkflow,
      toggleTask,
      resolveAlert,
      triggerMakeAutomation,
      resetDemoData,
      refreshAll,
      showToast,
      notification
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
