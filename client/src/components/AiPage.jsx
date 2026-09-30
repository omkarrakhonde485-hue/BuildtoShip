import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  Loader2, 
  ChevronRight,
  Layers,
  Zap,
  Receipt,
  LifeBuoy,
  UserPlus,
  Calendar,
  FileText
} from 'lucide-react';
import { DEMO_PRESETS } from './AiIntakeModal';

export default function AiPage({ onViewWorkflow }) {
  const { analyzeIntake, createWorkflowFromAi, currentUser } = useApp();
  const [prompt, setPrompt] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handlePreset = (text) => {
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
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLaunch = async () => {
    if (!analysisResult) return;
    try {
      setLaunching(true);
      const newWf = await createWorkflowFromAi(analysisResult);
      if (onViewWorkflow) onViewWorkflow(newWf);
    } catch (err) {
      console.error(err);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Page Title */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Google Gemini 1.5 Flash Operations Agent</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Central AI Operations Dispatcher
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Describe any company request in plain English. NEXUS AI will classify the workflow, extract variables, check business rules, and initialize the tasks.
        </p>
      </div>

      {/* 5 Demo Quick Scenario Cards */}
      <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Demo Scenarios (1-Click Presets)</span>
          <span className="text-[10px] text-indigo-400 font-normal">Click to fill prompt</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {DEMO_PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = prompt === p.prompt;
            return (
              <button
                key={p.id}
                onClick={() => handlePreset(p.prompt)}
                className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer flex items-start gap-2.5 ${
                  isSelected 
                    ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${p.color} text-white shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-200">{p.label}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{p.prompt}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Box */}
      <form onSubmit={handleAnalyze} className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Natural Language Request
        </label>
        <div className="relative">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Rahul Sharma is joining Engineering as a Software Intern on October 10..."
            className="w-full px-4 py-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-medium"
          />
          <button
            type="submit"
            disabled={analyzing || !prompt.trim()}
            className="absolute right-3.5 bottom-4 flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Request...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Process with Gemini</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Analysis Preview Card */}
      {analysisResult && (
        <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/40 p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                Intelligent Classification
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {analysisResult.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-3 py-1 rounded-lg font-bold uppercase ${
                analysisResult.priority === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                analysisResult.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}>
                {analysisResult.priority}
              </span>
              <span className="text-xs px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                {analysisResult.workflow_type.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300 bg-slate-800/40 p-3.5 rounded-2xl border border-slate-800">
            <strong className="text-indigo-300">AI Summary: </strong> {analysisResult.summary}
          </div>

          {/* Extracted Variables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(analysisResult.extracted_data || {}).map(([k, v]) => {
              if (typeof v === 'object') return null;
              return (
                <div key={k} className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] uppercase font-bold text-slate-400">{k.replace(/_/g, ' ')}</div>
                  <div className="text-xs font-bold text-slate-100 mt-1 truncate">
                    {typeof v === 'number' && k.toLowerCase().includes('amount') ? `₹${v.toLocaleString()}` : String(v)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Routing & Risks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-indigo-950/30 border border-indigo-500/20 px-4 py-2.5 rounded-2xl">
              <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Route: <strong className="text-indigo-300">{analysisResult.recommended_route}</strong></span>
            </div>

            {analysisResult.risk_flags && analysisResult.risk_flags.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Risk Alert: </span>
                  {analysisResult.risk_flags.join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Auto-Generated Tasks */}
          {analysisResult.tasks && analysisResult.tasks.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Generated Execution Tasks ({analysisResult.tasks.length})
              </div>
              <div className="space-y-1.5">
                {analysisResult.tasks.map((task, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
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

          {/* Action Button */}
          <div className="pt-3 flex justify-end">
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              {launching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploying to Workflow Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Launch Operations Workflow</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
