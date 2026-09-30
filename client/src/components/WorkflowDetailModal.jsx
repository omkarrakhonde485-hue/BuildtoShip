import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Send, 
  ShieldCheck, 
  UserCheck, 
  Layers, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  ArrowRight,
  Sparkles,
  Calendar,
  DollarSign,
  Tag,
  Activity,
  Check
} from 'lucide-react';

export default function WorkflowDetailModal({ workflow, onClose }) {
  const { 
    currentUser, 
    approveWorkflow, 
    rejectWorkflow, 
    advanceWorkflow, 
    toggleTask,
    triggerMakeAutomation
  } = useApp();

  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!workflow) return null;

  const pendingApproval = (workflow.approvals || []).find(a => a.status === 'pending');
  const canApprove = pendingApproval && (
    currentUser.role === 'Admin' || 
    currentUser.role === pendingApproval.approverRole ||
    (currentUser.role === 'Manager' && pendingApproval.approverRole === 'Manager') ||
    (currentUser.role === 'Finance' && (pendingApproval.approverRole === 'Finance' || workflow.type === 'expense'))
  );

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await approveWorkflow(workflow.id, pendingApproval?.id, comments);
      setComments('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      await rejectWorkflow(workflow.id, pendingApproval?.id, comments);
      setComments('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvance = async () => {
    try {
      setSubmitting(true);
      await advanceWorkflow(workflow.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl my-8 rounded-3xl bg-[#0F1423] border border-slate-700 shadow-2xl shadow-indigo-950/60 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
              workflow.type === 'expense' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              workflow.type === 'helpdesk' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              workflow.type === 'onboarding' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
              workflow.type === 'meetingops' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {workflow.type.toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                workflow.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                workflow.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {workflow.priority} Priority
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                workflow.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                workflow.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                {workflow.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Main Title & Creator Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {workflow.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Initiated by <strong>{workflow.creator?.name || 'Employee'}</strong></span>
                <span>•</span>
                <span>{workflow.department}</span>
                <span>•</span>
                <span>{new Date(workflow.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Automation Webhook Trigger */}
            <button
              onClick={() => triggerMakeAutomation(workflow.id, 'STATUS_CHECK')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer self-start"
            >
              <Send className="w-3.5 h-3.5 text-pink-400" />
              <span>Dispatch Webhook</span>
            </button>
          </div>

          {/* AI Structured Data Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(workflow.ai_data || {}).map(([key, val]) => {
              if (typeof val === 'object' || Array.isArray(val)) return null;
              return (
                <div key={key} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{key.replace(/_/g, ' ')}</div>
                  <div className="text-sm font-bold text-slate-100 mt-0.5 truncate">
                    {typeof val === 'number' && key.toLowerCase().includes('amount') ? `₹${val.toLocaleString()}` : String(val)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow Step Progression Timeline */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Workflow Execution Timeline</span>
              </div>
              {workflow.status !== 'completed' && workflow.status !== 'rejected' && (
                <button
                  onClick={handleAdvance}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/40 transition active:scale-95 cursor-pointer"
                >
                  <span>Advance to Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {(workflow.steps || []).map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isInProgress = step.status === 'in_progress';
                const isRejected = step.status === 'rejected';

                return (
                  <div key={step.id || idx} className="relative flex items-start gap-3">
                    <span className={`absolute -left-6 top-1 flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold ${
                      isCompleted ? 'bg-emerald-500 text-slate-950' :
                      isInProgress ? 'bg-indigo-500 text-white animate-pulse' :
                      isRejected ? 'bg-rose-500 text-white' :
                      'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${
                          isInProgress ? 'text-indigo-400 font-bold' :
                          isCompleted ? 'text-slate-200' :
                          'text-slate-400'
                        }`}>
                          {step.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                          isInProgress ? 'bg-indigo-500/20 text-indigo-300 font-bold' :
                          'text-slate-500'
                        }`}>
                          {step.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Assigned to: <span className="text-slate-300">{step.actor}</span>
                        {step.completedAt && ` • Done ${new Date(step.completedAt).toLocaleTimeString()}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Approval Action Box */}
          {pendingApproval && (
            <div className={`rounded-2xl p-5 border ${
              canApprove 
                ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20' 
                : 'bg-slate-900/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">
                    Approval Required: {pendingApproval.stepName}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Required Role: {pendingApproval.approverRole}
                </span>
              </div>

              {canApprove ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add approval comments / rationale (optional)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleReject}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 transition active:scale-95 cursor-pointer"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Reject Request</span>
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Approve & Advance</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Currently awaiting review from <strong>{pendingApproval.approverName || pendingApproval.approverRole}</strong>.
                  <span className="block mt-1 text-slate-500">
                    (Tip: Switch role to <strong>{pendingApproval.approverRole}</strong> using the top right switcher to approve/reject).
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Dynamic Executable Tasks */}
          {workflow.tasks && workflow.tasks.length > 0 && (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Action Tasks Checklist ({workflow.tasks.filter(t => t.status === 'completed').length}/{workflow.tasks.length} Completed)
              </div>
              <div className="space-y-2">
                {workflow.tasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(workflow.id, task.id, task.status)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition cursor-pointer ${
                        isDone 
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                        />
                        <span className={`font-medium ${isDone ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {task.assignee} ({task.role})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Log & Audit Trail */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Immutable Activity & Audit Trail</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(workflow.activity_logs || []).map((log, i) => (
                <div key={i} className="text-xs p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-semibold text-indigo-300">{log.actor}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="font-medium text-slate-200 mt-0.5">{log.action}</div>
                  {log.details && <div className="text-slate-400 text-[11px] mt-0.5">{log.details}</div>}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
