import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export const ROLES = [
  { id: 'user_emp_1', name: 'Omkar Dev', role: 'Employee', department: 'Engineering', title: 'Senior Software Engineer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { id: 'user_mgr_1', name: 'Sarah Connor', role: 'Manager', department: 'Engineering', title: 'Engineering Director', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: 'user_fin_1', name: 'Vikram Mehta', role: 'Finance', department: 'Finance', title: 'Finance Lead & Controller', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'user_hr_1', name: 'Priya Sharma', role: 'HR', department: 'People Operations', title: 'Head of People Operations', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { id: 'user_it_1', name: 'Alex Rivera', role: 'IT', department: 'IT Support', title: 'Systems & SecOps Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'user_adm_1', name: 'Elena Rostova', role: 'Admin', department: 'Executive Operations', title: 'Chief Operations Officer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(ROLES[5]); // Default Elena Rostova (Admin)
  const [workflows, setWorkflows] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [monitorData, setMonitorData] = useState({ alerts: [], activityLogs: [], metrics: {} });
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [session, setSession] = useState(null);

  // Show floating toast notification
  const showToast = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  // Fetch all live data for the active user/role
  const loadAllData = useCallback(async (role = currentUser.role, user = currentUser) => {
    try {
      const headers = { 'X-Demo-Role': role };
      const [wfRes, tskRes, appRes, monRes] = await Promise.all([
        fetch(`${API_BASE}/api/workflows?role=${encodeURIComponent(role)}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/tasks?role=${encodeURIComponent(role)}&user=${encodeURIComponent(user.name)}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/approvals?role=${encodeURIComponent(role)}`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/monitor/events`, { headers }).then(r => r.json())
      ]);

      if (Array.isArray(wfRes)) setWorkflows(wfRes);
      if (Array.isArray(tskRes)) setTasks(tskRes);
      if (Array.isArray(appRes)) setApprovals(appRes);
      if (monRes && typeof monRes === 'object') setMonitorData(monRes);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Role Switcher
  const switchRole = useCallback((roleId) => {
    const found = ROLES.find(r => r.id === roleId);
    if (found) {
      setCurrentUser(found);
      loadAllData(found.role, found);
      showToast(`Switched persona to ${found.name} (${found.role})`, 'info');
    }
  }, [loadAllData, showToast]);

  // Initial load & Supabase Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        api.setToken(session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        api.setToken(session.access_token);
      }
    });

    loadAllData();

    return () => subscription.unsubscribe();
  }, [loadAllData]);

  // AI Operations Intake Analysis
  const analyzeIntake = async (prompt) => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        },
        body: JSON.stringify({ prompt, user: currentUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze request');
      return data;
    } catch (err) {
      showToast(`AI Analysis Error: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Create workflow from AI analysis
  const createWorkflowFromAi = async (analysisResult) => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        },
        body: JSON.stringify({
          ...analysisResult,
          creator: currentUser
        })
      });
      const newWf = await res.json();
      if (!res.ok) throw new Error(newWf.error || 'Failed to launch workflow');
      
      showToast(`Workflow "${newWf.title || 'Request'}" launched successfully!`, 'success');
      await loadAllData();
      return newWf;
    } catch (err) {
      showToast(`Failed to create workflow: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Workflow Approval
  const approveWorkflow = async (workflowId, comments = 'Approved') => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        },
        body: JSON.stringify({ comments, approver: currentUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      
      showToast('Workflow approved successfully!', 'success');
      await loadAllData();
      return data;
    } catch (err) {
      showToast(`Approval Error: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Workflow Rejection
  const rejectWorkflow = async (workflowId, comments = 'Rejected') => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        },
        body: JSON.stringify({ comments, approver: currentUser })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      
      showToast('Workflow rejected.', 'warning');
      await loadAllData();
      return data;
    } catch (err) {
      showToast(`Rejection Error: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Advance workflow to next step
  const advanceWorkflow = async (workflowId) => {
    try {
      const res = await fetch(`${API_BASE}/api/workflows/${workflowId}/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Advance failed');
      
      showToast('Workflow advanced to next stage!', 'success');
      await loadAllData();
      return data;
    } catch (err) {
      showToast(`Error: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Toggle Task Completion
  const toggleTask = async (arg1, arg2) => {
    try {
      const taskId = (arg2 && typeof arg2 === 'string') ? arg2 : arg1;
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        },
        body: JSON.stringify({ workflowId: arg2 ? arg1 : undefined, taskId })
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Task toggle failed');

      showToast(`Task ${updated.status === 'completed' ? 'completed' : 'reopened'}`, 'success');
      await loadAllData();
      return updated;
    } catch (err) {
      showToast(`Task update failed: ${err.message}`, 'warning');
      throw err;
    }
  };

  // Make.com Webhook trigger
  const triggerMakeAutomation = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/integrations/make-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISPATCH_ALERT',
          triggeredBy: currentUser.name,
          role: currentUser.role,
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();
      showToast(data.message || 'Make.com automation dispatched!', 'success');
      await loadAllData();
    } catch (err) {
      showToast(`Make automation failed: ${err.message}`, 'warning');
    }
  };

  // Reset demo database to initial state
  const resetDemoData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/demo/reset`, { method: 'POST' });
      const data = await res.json();
      showToast(data.message || 'Database reset to initial demo state', 'info');
      await loadAllData();
    } catch (err) {
      showToast(`Reset failed: ${err.message}`, 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Supabase Auth Methods
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const value = {
    currentUser,
    user: currentUser,
    session,
    isAuthenticated: !!session,
    workflows,
    tasks,
    approvals,
    monitorData,
    selectedWorkflow,
    setSelectedWorkflow,
    loading,
    notification,
    showToast,
    switchRole,
    loadAllData,
    analyzeIntake,
    createWorkflowFromAi,
    approveWorkflow,
    rejectWorkflow,
    advanceWorkflow,
    toggleTask,
    triggerMakeAutomation,
    resetDemoData,
    signIn,
    signUp,
    signOut
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;
