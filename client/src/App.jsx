import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import AiPage from './components/AiPage';
import WorkflowsList from './components/WorkflowsList';
import ApprovalsView from './components/ApprovalsView';
import TasksView from './components/TasksView';
import MonitorView from './components/MonitorView';
import AiIntakeModal from './components/AiIntakeModal';
import WorkflowDetailModal from './components/WorkflowDetailModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function MainApp() {
  const [currentTab, setTab] = useState('dashboard');
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const { selectedWorkflow, setSelectedWorkflow, notification } = useApp();

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header & Persona Switcher */}
      <Header onOpenIntake={() => setIntakeModalOpen(true)} />

      {/* Main Tabbed Navigation */}
      <Navigation currentTab={currentTab} setTab={setTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            onOpenIntake={() => setIntakeModalOpen(true)}
            onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
            setTab={setTab}
          />
        )}

        {currentTab === 'ai' && (
          <AiPage
            onViewWorkflow={(wf) => setSelectedWorkflow(wf)}
          />
        )}

        {currentTab === 'workflows' && (
          <WorkflowsList
            onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
            onOpenIntake={() => setIntakeModalOpen(true)}
          />
        )}

        {currentTab === 'approvals' && (
          <ApprovalsView
            onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
          />
        )}

        {currentTab === 'monitor' && (
          <MonitorView
            onSelectWorkflow={(wf) => setSelectedWorkflow(wf)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-400">NEXUS AI</strong> — Company AI Operations Control Center
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Powered by Google Gemini 1.5 Flash</span>
            <span>•</span>
            <span>State Synchronized</span>
            <span>•</span>
            <span className="text-emerald-400">Live Ops Engine</span>
          </div>
        </div>
      </footer>

      {/* Global AI Intake Modal */}
      <AiIntakeModal
        isOpen={intakeModalOpen}
        onClose={() => setIntakeModalOpen(false)}
        onViewWorkflow={(wf) => setSelectedWorkflow(wf)}
      />

      {/* Global Workflow Detail Modal */}
      <WorkflowDetailModal
        workflow={selectedWorkflow}
        onClose={() => setSelectedWorkflow(null)}
      />

      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/40 text-slate-100 shadow-2xl shadow-indigo-950/60 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span className="text-xs font-semibold">{notification.message}</span>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
