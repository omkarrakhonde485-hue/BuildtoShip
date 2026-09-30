import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  CheckSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  UserCheck, 
  DollarSign, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function ApprovalsView({ onSelectWorkflow }) {
  const { 
    approvals, 
    currentUser, 
    approveWorkflow, 
    rejectWorkflow, 
    workflows 
  } = useApp();

  const [activeTab, setActiveTab] = useState('pending');
  const [commentInputs, setCommentInputs] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const pendingApprovals = approvals.filter(a => a.status === 'pending');
  const pastApprovals = approvals.filter(a => a.status !== 'pending');

  const displayedApprovals = activeTab === 'pending' ? pendingApprovals : pastApprovals;

  const handleCommentChange = (id, text) => {
    setCommentInputs(prev => ({ ...prev, [id]: text }));
  };

  const handleApprove = async (approval) => {
    try {
      setActionLoading(approval.id);
      await approveWorkflow(approval.workflowId, approval.id, commentInputs[approval.id] || '');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (approval) => {
    try {
      setActionLoading(approval.id);
      await rejectWorkflow(approval.workflowId, approval.id, commentInputs[approval.id] || '');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>Approvals Queue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {pendingApprovals.length} Pending
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-governed authorization queue for Managers, Finance Controllers, and Department Leads
          </p>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'pending' 
                ? 'bg-amber-500 text-slate-950 shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Actions ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Decision History ({pastApprovals.length})
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {displayedApprovals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
          <div className="text-base font-bold text-slate-300">Queue is Clear</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'pending' 
              ? 'No pending approvals require your signoff right now.' 
              : 'No past approval decisions recorded yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedApprovals.map((approval) => {
            const wf = workflows.find(w => w.id === approval.workflowId);
            const isPending = approval.status === 'pending';
            const canAct = isPending && (
              currentUser.role === 'Admin' ||
              currentUser.role === approval.approverRole ||
              (currentUser.role === 'Manager' && approval.approverRole === 'Manager') ||
              (currentUser.role === 'Finance' && approval.approverRole === 'Finance')
            );

            return (
              <div
                key={approval.id}
                className={`p-5 rounded-2xl border transition space-y-4 ${
                  isPending 
                    ? 'bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-950/10' 
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        approval.workflowType === 'expense' ? 'bg-emerald-500/20 text-emerald-400' :
                        approval.workflowType === 'approval' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {approval.workflowType}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {approval.stepName}
                      </span>
                    </div>
                    
                    <h3 
                      onClick={() => wf && onSelectWorkflow(wf)}
                      className="text-base font-bold text-white hover:text-indigo-300 transition cursor-pointer flex items-center gap-2"
                    >
                      <span>{approval.workflowTitle}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </h3>

                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Submitted by <strong>{approval.creator?.name || 'Employee'}</strong> ({approval.creator?.department || 'Engineering'})</span>
                      <span>•</span>
                      <span>{new Date(approval.requestedAt || approval.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {approval.amount && (
                      <div className="text-lg font-black text-white font-mono">
                        ₹{Number(approval.amount).toLocaleString()}
                      </div>
                    )}
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                      approval.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      approval.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {approval.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Approver Action Panel */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    {canAct ? (
                      <>
                        <input
                          type="text"
                          value={commentInputs[approval.id] || ''}
                          onChange={(e) => handleCommentChange(approval.id, e.target.value)}
                          placeholder="Add approval comment or budget notes (optional)..."
                          className="w-full sm:w-80 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleReject(approval)}
                            disabled={actionLoading === approval.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 transition active:scale-95 cursor-pointer"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleApprove(approval)}
                            disabled={actionLoading === approval.id}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approve & Advance</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-slate-400">
                        Awaiting review from <strong className="text-amber-300">{approval.approverRole}</strong> role.
                        <span className="text-slate-500 ml-1">
                          (Switch role to {approval.approverRole} above to decide)
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Past Decision Notes */}
                {!isPending && approval.comments && (
                  <div className="text-xs p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-slate-300">
                    <span className="font-semibold text-slate-400">Decision Notes: </span>
                    {approval.comments}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
