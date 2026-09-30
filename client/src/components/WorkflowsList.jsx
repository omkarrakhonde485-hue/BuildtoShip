import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  GitBranch, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  Plus,
  ArrowUpDown,
  Tag
} from 'lucide-react';

const WORKFLOW_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'approval', label: 'ApprovalFlow' },
  { id: 'expense', label: 'ExpenseFlow' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'helpdesk', label: 'AI Helpdesk' },
  { id: 'meetingops', label: 'MeetingOps' }
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Statuses' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' }
];

export default function WorkflowsList({ onSelectWorkflow, onOpenIntake }) {
  const { workflows, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredWorkflows = workflows.filter(wf => {
    const matchesSearch = 
      wf.title.toLowerCase().includes(search.toLowerCase()) ||
      wf.type.toLowerCase().includes(search.toLowerCase()) ||
      (wf.creator?.name || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesType = selectedType === 'all' || wf.type.toLowerCase() === selectedType.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || wf.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-indigo-400" />
            <span>Operations Workflows</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {filteredWorkflows.length}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized orchestration across Approvals, Expenses, Onboarding, IT Helpdesk & MeetingOps
          </p>
        </div>

        <button
          onClick={onOpenIntake}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>New AI Intake</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows, owners, or IDs..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
          {/* Type dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {WORKFLOW_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Status dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Workflows Cards List */}
      {filteredWorkflows.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <GitBranch className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-base font-bold text-slate-300">No Workflows Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active workflows match your current search filters or permissions.
          </p>
          <button
            onClick={onOpenIntake}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create via AI Intake</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkflows.map((wf) => {
            const pendingApp = (wf.approvals || []).find(a => a.status === 'pending');
            const completedSteps = (wf.steps || []).filter(s => s.status === 'completed').length;
            const totalSteps = (wf.steps || []).length;
            const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

            return (
              <div
                key={wf.id}
                onClick={() => onSelectWorkflow(wf)}
                className="p-5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-lg ${
                        wf.type === 'expense' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        wf.type === 'helpdesk' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        wf.type === 'onboarding' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                        wf.type === 'meetingops' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {wf.type}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        wf.priority === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                        wf.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {wf.priority}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wf.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      wf.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-indigo-500/20 text-indigo-300'
                    }`}>
                      {wf.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
                    {wf.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    Current Stage: <strong className="text-slate-300">{wf.current_step}</strong>
                  </p>
                </div>

                {/* Progress bar and details footer */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progress: {completedSteps}/{totalSteps} Milestones</span>
                    <span className="font-semibold text-slate-300">{progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Owner: {wf.creator?.name || 'Employee'} ({wf.department})</span>
                    {wf.ai_data?.amount && (
                      <span className="font-bold text-slate-200 font-mono">₹{Number(wf.ai_data.amount).toLocaleString()}</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
