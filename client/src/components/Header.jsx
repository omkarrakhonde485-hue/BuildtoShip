import React, { useState } from 'react';
import { useApp, ROLES } from '../context/AppContext';
import { 
  Bot, 
  ShieldCheck, 
  Sparkles, 
  RotateCcw, 
  Send, 
  UserCheck, 
  ChevronDown, 
  Activity,
  Layers,
  Cpu
} from 'lucide-react';

export default function Header({ onOpenIntake }) {
  const { currentUser, switchRole, resetDemoData, triggerMakeAutomation, monitorData } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-xl px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & AI Pulse */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                NEXUS <span className="ai-gradient-text font-black">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Ops Control
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Company AI Operations Control Center
            </p>
          </div>
        </div>

        {/* Global Live System Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">Central Agent:</span>
            <span className="text-emerald-400 font-semibold">Online (Gemini)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">SLA Compliance:</span>
            <span className="text-indigo-300 font-semibold">{monitorData.metrics?.slaComplianceRate || '98.4%'}</span>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick AI Intake Trigger Button */}
          <button
            onClick={onOpenIntake}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all border border-indigo-400/30 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span className="hidden sm:inline">AI Operations Intake</span>
            <span className="sm:hidden">Intake</span>
          </button>

          {/* Make.com Simulation */}
          <button
            onClick={() => triggerMakeAutomation()}
            title="Dispatch simulated Make.com webhook & Gmail alert"
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-slate-700 transition active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-pink-400" />
            <span>Make Webhook</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetDemoData}
            title="Reset DB to fresh seed demo state"
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Interactive Role Switcher Persona Bar */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700 text-left transition cursor-pointer"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-2 ring-indigo-500/40"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  {currentUser.name}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    currentUser.role === 'Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    currentUser.role === 'Manager' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    currentUser.role === 'Finance' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    currentUser.role === 'HR' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' :
                    currentUser.role === 'IT' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">{currentUser.department}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
                  <span>Switch Role / Persona</span>
                  <span className="text-[10px] text-indigo-400 font-normal">Demo Mode</span>
                </div>
                <div className="py-1 space-y-1">
                  {ROLES.map((r) => {
                    const isSelected = r.id === currentUser.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          switchRole(r.id);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600/20 border border-indigo-500/40 text-white' 
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <img src={r.avatar} alt={r.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span className="truncate">{r.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                              r.role === 'Admin' ? 'bg-purple-500/20 text-purple-300' :
                              r.role === 'Manager' ? 'bg-amber-500/20 text-amber-300' :
                              r.role === 'Finance' ? 'bg-emerald-500/20 text-emerald-300' :
                              r.role === 'HR' ? 'bg-pink-500/20 text-pink-300' :
                              r.role === 'IT' ? 'bg-cyan-500/20 text-cyan-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {r.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{r.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
