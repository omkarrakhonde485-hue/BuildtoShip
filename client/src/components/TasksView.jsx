import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';

export default function TasksView({ onSelectWorkflow }) {
  const { tasks, toggleTask, workflows, currentUser } = useApp();
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');

  const rolesList = ['all', 'Employee', 'Manager', 'Finance', 'HR', 'IT'];

  const filteredTasks = tasks.filter(t => {
    const matchesRole = filterRole === 'all' || (t.role || '').toLowerCase() === filterRole.toLowerCase();
    const isCompleted = t.status === 'completed';
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && !isCompleted) || 
      (filterStatus === 'completed' && isCompleted);

    return matchesRole && matchesStatus;
  });

  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <ListTodo className="w-6 h-6 text-indigo-400" />
            <span>Operations Tasks</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {pendingCount} Open
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Executable operational tasks generated and assigned dynamically by Central AI & Workflow Engine
          </p>
        </div>

        {/* Status Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'pending' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'completed' 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all' 
                ? 'bg-slate-700 text-white' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({tasks.length})
          </button>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">Assignee Role:</span>
        {rolesList.map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition cursor-pointer ${
              filterRole === r 
                ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40' 
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto" />
          <div className="text-base font-bold text-slate-300">No Tasks in View</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All tasks for this filter have been completed or none exist.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            const wf = workflows.find(w => w.id === task.workflowId);

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  isDone 
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(task.workflowId, task.id, task.status)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition mt-0.5 cursor-pointer shrink-0 ${
                      isDone 
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950' 
                        : 'bg-slate-800 border-slate-700 hover:border-indigo-500'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className={`text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                      {task.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      {wf && (
                        <button
                          onClick={() => onSelectWorkflow(wf)}
                          className="hover:text-indigo-300 transition underline cursor-pointer truncate max-w-xs"
                        >
                          {task.workflowTitle}
                        </button>
                      )}
                      <span>•</span>
                      <span className="text-slate-300">Assignee: {task.assignee} ({task.role})</span>
                      {task.dueDate && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3 text-indigo-400" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {isDone ? 'Completed' : 'Pending'}
                </span>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
