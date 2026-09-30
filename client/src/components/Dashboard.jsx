import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  GitBranch, 
  CheckSquare, 
  ListTodo, 
  Activity, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  UserCheck, 
  Receipt, 
  LifeBuoy, 
  UserPlus, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  Layers,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { DEMO_PRESETS } from './AiIntakeModal';

export default function Dashboard({ onOpenIntake, onSelectWorkflow, setTab }) {
  const { 
    currentUser, 
    workflows, 
    tasks, 
    approvals, 
    monitorData, 
    toggleTask,
    resolveAlert
  } = useApp();

  const activeWorkflows = workflows.filter(w => w.status === 'in_progress' || w.status === 'pending_approval');
  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const criticalAlerts = (monitorData.alerts || []).filter(a => a.status === 'active');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner: Role Context & Hero AI Trigger */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase tracking-wider">
                {currentUser.role} Operations View
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Department: {currentUser.department}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              NEXUS Central AI is monitoring <strong className="text-indigo-300">{activeWorkflows.length} active workflows</strong>, <strong className="text-amber-300">{pendingApprovals.length} approvals</strong>, and <strong className="text-emerald-300">{pendingTasks.length} live tasks</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenIntake}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Launch AI Request</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTab('workflows')}
              className="px-4 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 font-semibold text-sm border border-slate-700 transition cursor-pointer"
            >
              View Workflows
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Workflows */}
        <div 
          onClick={() => setTab('workflows')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Workflows</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {activeWorkflows.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{workflows.filter(w => w.status === 'completed').length} completed</span> in total
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={() => setTab('approvals')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {pendingApprovals.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Requires Manager / Finance signoff
          </div>
        </div>

        {/* Action Tasks */}
        <div 
          onClick={() => setTab('tasks')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Open Tasks</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {pendingTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Assigned across team members
          </div>
        </div>

        {/* AI Operations Monitor Alerts */}
        <div 
          onClick={() => setTab('monitor')}
          className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">AI Monitor Alerts</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {criticalAlerts.length}
          </div>
          <div className="text-[11px] text-rose-400 font-semibold mt-1">
            {criticalAlerts.length > 0 ? 'Active SLA / Risk warnings' : 'All systems normal'}
          </div>
        </div>

      </div>

      {/* Quick Launch Scenario Presets Row */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>1-Click Test Scenarios (Demo Presets)</span>
          </div>
          <span className="text-xs text-indigo-400 font-medium">Click to populate intake</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {DEMO_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={onOpenIntake}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition hover:border-indigo-500/40 cursor-pointer group"
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${preset.color} text-white shrink-0 group-hover:scale-105 transition`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{preset.label}</div>
                  <div className="text-[10px] text-slate-400">Launch Test</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Active Workflows List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Active Operations Workflows</span>
            </h2>
            <button
              onClick={() => setTab('workflows')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({workflows.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {workflows.slice(0, 4).map((wf) => {
              const pendingApp = (wf.approvals || []).find(a => a.status === 'pending');
              return (
                <div
                  key={wf.id}
                  onClick={() => onSelectWorkflow(wf)}
                  className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          wf.type === 'expense' ? 'bg-emerald-500/20 text-emerald-400' :
                          wf.type === 'helpdesk' ? 'bg-rose-500/20 text-rose-400' :
                          wf.type === 'onboarding' ? 'bg-pink-500/20 text-pink-400' :
                          wf.type === 'meetingops' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {wf.type}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          wf.priority === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                          wf.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {wf.priority}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition truncate">
                        {wf.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        Current Step: <strong className="text-slate-300">{wf.current_step}</strong> • Created by {wf.creator?.name || 'Employee'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {wf.ai_data?.amount && (
                        <div className="text-sm font-bold text-white font-mono">
                          ₹{Number(wf.ai_data.amount).toLocaleString()}
                        </div>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        wf.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        wf.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {wf.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Visual Step Progress Dots */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                    {(wf.steps || []).map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={`h-1.5 rounded-full flex-1 transition-all ${
                          step.status === 'completed' ? 'bg-emerald-500' :
                          step.status === 'in_progress' ? 'bg-indigo-500 animate-pulse' :
                          'bg-slate-800'
                        }`}
                        title={`${step.name} (${step.status})`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Live AI Operations Monitor & Approvals */}
        <div className="space-y-6">
          
          {/* AI Operations Radar Widget */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>AI Operations Radar</span>
              </div>
              <button
                onClick={() => setTab('monitor')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Control Center
              </button>
            </div>

            <div className="space-y-2.5">
              {criticalAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`font-bold uppercase px-1.5 py-0.2 rounded ${
                      alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                      alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-slate-400">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    {alert.message}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span className="truncate">Auto-Action: {alert.suggestedAction}</span>
                    <button
                      onClick={() => resolveAlert(alert.id, 'Remediated from Dashboard')}
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                    >
                      Auto-Heal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Tasks Quick Checklist */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                <span>Quick Tasks Checklist</span>
              </div>
              <button
                onClick={() => setTab('tasks')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                All Tasks
              </button>
            </div>

            <div className="space-y-2">
              {pendingTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.workflowId, task.id, task.status)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 text-xs transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-900 border-slate-700 mt-0.5 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 truncate">{task.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Assignee: {task.assignee} ({task.role})
                    </div>
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
