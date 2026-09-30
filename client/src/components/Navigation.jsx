import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  GitBranch, 
  CheckSquare, 
  ListTodo, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navigation({ currentTab, setTab }) {
  const { approvals, tasks, monitorData, currentUser } = useApp();

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const activeAlertsCount = (monitorData.alerts || []).filter(a => a.status === 'active').length;

  const tabs = [
    { id: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
    { id: 'ai', label: 'Central AI Intake', icon: Sparkles, highlight: true },
    { id: 'workflows', label: 'Workflows & State', icon: GitBranch },
    { id: 'approvals', label: 'Approvals Queue', icon: CheckSquare, badge: pendingApprovalsCount, badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    { id: 'tasks', label: 'Operations Tasks', icon: ListTodo, badge: pendingTasksCount, badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
    { id: 'monitor', label: 'AI Operations Monitor', icon: Activity, badge: activeAlertsCount, badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
  ];

  return (
    <nav className="border-b border-slate-800 bg-[#0E1321]/60 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/40'
                  : tab.highlight
                  ? 'text-indigo-300 hover:text-white hover:bg-slate-800/70 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${isActive ? 'bg-white/20 text-white border-white/30' : tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
