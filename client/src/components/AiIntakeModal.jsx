import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  X, 
  FileText, 
  UserPlus, 
  Receipt, 
  LifeBuoy, 
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';

export const DEMO_PRESETS = [
  {
    id: 'expense',
    icon: Receipt,
    label: 'Expense Claim',
    color: 'from-emerald-600 to-teal-700',
    prompt: "I spent ₹2,850 during yesterday's Mumbai client visit."
  },
  {
    id: 'helpdesk',
    icon: LifeBuoy,
    label: 'IT Helpdesk Incident',
    color: 'from-rose-600 to-red-700',
    prompt: "My laptop Wi-Fi is not working and I have a client presentation in 20 minutes."
  },
  {
    id: 'onboarding',
    icon: UserPlus,
    label: 'Employee Onboarding',
    color: 'from-pink-600 to-purple-700',
    prompt: "Rahul Sharma is joining Engineering as a Software Intern on October 10."
  },
  {
    id: 'meetingops',
    icon: Calendar,
    label: 'MeetingOps Transcript',
    color: 'from-blue-600 to-indigo-700',
    prompt: "Omkar will finish the API by Friday. Priya will prepare the presentation. Rahul will contact the client tomorrow."
  },
  {
    id: 'approval',
    icon: FileText,
    label: 'Equipment Approval',
    color: 'from-amber-600 to-orange-700',
    prompt: "I need a ₹35,000 monitor for my development work."
  }
];

export default function AiIntakeModal({ isOpen, onClose, onViewWorkflow }) {
  const { analyzeIntake, createWorkflowFromAi, currentUser } = useApp();
  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  if (!isOpen) return null;

  const handlePresetSelect = (text) => {
    setPrompt(text);
    setAnalysisResult(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setAnalyzing(true);
      setAnalysisResult(null);
      const result = await analyzeIntake(prompt);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Intake analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLaunch = async () => {
    if (!analysisResult) return;
    try {
      setLaunching(true);
      const newWf = await createWorkflowFromAi(analysisResult);
      if (onClose) onClose();
      if (onViewWorkflow) onViewWorkflow(newWf);
    } catch (err) {
      console.error('Failed to launch workflow:', err);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-[#0F1423] border border-slate-700/80 shadow-2xl shadow-indigo-950/50 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Central AI Operations Intake
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Gemini Flash 1.5
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Natural Language → Structured Extraction → Routing & Autonomous Orchestration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Quick Preset Scenarios */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <span>Demo Quick-Launch Scenarios</span>
              <span className="text-[10px] text-indigo-400 font-normal">(Click any scenario to test)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {DEMO_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = prompt === preset.prompt;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.prompt)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${preset.color} text-white shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-200">{preset.label}</div>
                      <div className="text-[11px] text-slate-400 truncate">{preset.prompt}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Natural Language Input Field */}
          <form onSubmit={handleAnalyze} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              What do you need to get done?
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. I need reimbursement for ₹2,850 from yesterday's client meeting in Mumbai..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
              <button
                type="submit"
                disabled={analyzing || !prompt.trim()}
                className="absolute right-3 bottom-3.5 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze with AI</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* AI Analysis Preview Card */}
          {analysisResult && (
            <div className="rounded-2xl bg-slate-900/80 border border-indigo-500/40 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Classification Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    AI Identified Workflow
                  </span>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {analysisResult.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                    analysisResult.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    analysisResult.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {analysisResult.priority} Priority
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    {analysisResult.workflow_type.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-indigo-300">AI Summary: </span>
                {analysisResult.summary}
              </p>

              {/* Extracted Structured Entities */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {Object.entries(analysisResult.extracted_data || {}).map(([key, val]) => {
                  if (typeof val === 'object') return null;
                  return (
                    <div key={key} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <div className="text-[10px] uppercase text-slate-400 font-bold">{key.replace(/_/g, ' ')}</div>
                      <div className="font-semibold text-slate-100 mt-0.5 truncate">
                        {typeof val === 'number' && key.toLowerCase().includes('amount') ? `₹${val.toLocaleString()}` : String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Policy / Risk Flags */}
              {analysisResult.risk_flags && analysisResult.risk_flags.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2 text-xs text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Risk / Policy Alert: </span>
                    {analysisResult.risk_flags.join(', ')}
                  </div>
                </div>
              )}

              {/* Recommended Routing */}
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-indigo-950/30 border border-indigo-500/20 px-3 py-2 rounded-xl">
                <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                <span><span className="text-slate-400">Recommended Route:</span> <strong className="text-indigo-300">{analysisResult.recommended_route}</strong></span>
              </div>

              {/* Auto-Generated Dynamic Tasks */}
              {analysisResult.tasks && analysisResult.tasks.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-2">
                    Auto-Generated Execution Tasks ({analysisResult.tasks.length})
                  </div>
                  <div className="space-y-1.5">
                    {analysisResult.tasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-800/40 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-slate-200">{task.title}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {task.assignee || task.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Launch Workflow Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
                >
                  {launching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Launching Workflow Engine...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Start Operations Workflow</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
