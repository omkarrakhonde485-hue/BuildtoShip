import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  GitBranch, 
  CheckSquare, 
  ListTodo, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Layers,
  Zap,
  CheckCircle2
} from 'lucide-react';

export default function Dashboard({ onOpenIntake, onSelectWorkflow, setTab }) {
  const { 
    currentUser, 
    workflows, 
    tasks, 
    approvals, 
    monitorData, 
    approveWorkflow, 
    rejectWorkflow 
  } = useApp();

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const activeAlerts = (monitorData.alerts || []).filter(a => a.status === 'active');
  const completedWorkflows = workflows.filter(w => w.status === 'completed');
  const activeWorkflows = workflows.filter(w => !['completed', 'rejected', 'cancelled'].includes(w.status));

  // Distribution by type
  const dist = workflows.reduce((acc, wf) => {
    const type = wf.type || wf.workflow_type || 'approval';
    if (!acc[type]) acc[type] = { total: 0, completed: 0, active: 0 };
    acc[type].total++;
    if (wf.status === 'completed') acc[type].completed++;
    else acc[type].active++;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Central AI Engine Synchronized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="ai-gradient-text">{currentUser.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              NEXUS AI is managing company operations in real-time across Approvals, Expenses, Onboarding, IT Helpdesk, and Meeting Workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenIntake}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Launch AI Operations Intake</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Workflows */}
        <div 
          onClick={() => setTab('workflows')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/40 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Active Workflows</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{activeWorkflows.length}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-indigo-400">
            <span>{workflows.length} total operations</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => setTab('approvals')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{pendingApprovals.length}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400">
            <span>Action required</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Open Tasks */}
        <div 
          onClick={() => setTab('tasks')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Open Tasks</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{pendingTasks.length}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-400">
            <span>{tasks.filter(t => t.status === 'completed').length} completed</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Active Alerts */}
        <div 
          onClick={() => setTab('monitor')}
          className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-rose-500/40 transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Active Alerts</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{activeAlerts.length}</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-rose-400">
            <span>SLA: {monitorData.metrics?.slaComplianceRate || '98.6%'}</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* Main Content Split: Workflow Distribution & Quick Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Workflows List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Active Operations Pipeline</span>
            </h2>
            <button 
              onClick={() => setTab('workflows')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {workflows.slice(0, 5).map((wf) => (
              <div
                key={wf.id}
                onClick={() => onSelectWorkflow(wf)}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850/80 transition flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      wf.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      wf.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {wf.priority}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      {(wf.type || wf.workflow_type || 'approval')}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400 truncate">
                      {wf.creator?.name || 'Assigned User'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {wf.title}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    wf.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    wf.status === 'awaiting_approval' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    wf.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                    'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {wf.status === 'awaiting_approval' ? 'Needs Approval' : wf.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}

            {workflows.length === 0 && (
              <div className="text-center py-10 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                No workflows found. Launch one via Central AI Intake!
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Pending Approvals & Live Operations Stream */}
        <div className="space-y-6">
          
          {/* Quick Approvals Queue */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>Pending Approvals</span>
              </h2>
              {pendingApprovals.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {pendingApprovals.slice(0, 3).map((app) => (
                <div 
                  key={app.id} 
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2.5"
                >
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {app.workflowTitle || 'Approval Request'}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>From: {app.creator?.name || 'Team Member'}</span>
                    <span className="text-amber-400 uppercase font-mono">{app.workflowType}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => approveWorkflow(app.workflow_id || app.id)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectWorkflow(app.workflow_id || app.id)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 font-bold text-xs border border-slate-700 transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {pendingApprovals.length === 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1 opacity-70" />
                  No pending approvals in your queue
                </div>
              )}
            </div>
          </div>

          {/* Workflow Types Distribution */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workflow Distribution
            </div>
            <div className="space-y-2">
              {Object.entries(dist).map(([type, stats]) => (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300 capitalize">{type}</span>
                    <span className="text-slate-400">{stats.completed}/{stats.total}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
