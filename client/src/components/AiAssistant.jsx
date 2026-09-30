import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  Loader2, 
  Terminal, 
  ArrowRight, 
  FileText, 
  ShieldCheck,
  Calendar,
  Mail,
  HardDrive
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function AiAssistant({ onViewWorkflow }) {
  const { showToast, loadAllData, currentUser } = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello ${currentUser.name}! I'm **NEXUS AI**, your operations intelligence agent.\n\nI can execute operations across the company via real Gemini tool-calling:\n• **Expense claims** — *"I spent ₹2,850 on client visit yesterday"*\n• **Equipment approvals** — *"I need a ₹35,000 developer monitor"*\n• **IT helpdesk** — *"Wi-Fi is down before client presentation"*\n• **Onboarding** — *"Rahul is joining Engineering on Oct 10"*\n• **Meeting action items** — Paste meeting notes\n• **Google Workspace** — Search Drive, schedule Calendar events, or draft emails\n\nHow can I help you today?`,
      toolCalls: []
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || sending) return;

    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', text: msg }]);

    try {
      const res = await fetch(`${API_BASE}/api/ai/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Demo-Role': currentUser.role
        },
        body: JSON.stringify({ message: msg })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || 'AI request failed');

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: result.message || 'Request executed.',
          toolCalls: result.toolCalls || [],
          workflow: result.workflow,
          ai: result.ai
        }
      ]);

      if (result.toolCalls?.some(t => t.tool === 'create_workflow' && t.success)) {
        showToast('New workflow created and routed!', 'success');
        await loadAllData();
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ Error executing request: ${err.message}. Please check credentials or try again.`,
          isError: true,
          toolCalls: []
        }
      ]);
      showToast(`Agent Error: ${err.message}`, 'warning');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: '💰 Expense Claim', text: 'I need reimbursement for ₹2,850 from yesterday\'s client visit in Mumbai.' },
    { label: '🖥️ Equipment Request', text: 'I need approval to buy a ₹35,000 monitor for my development work.' },
    { label: '🔧 Critical IT Helpdesk', text: 'My laptop Wi-Fi is not working and I have a client presentation in 20 minutes.' },
    { label: '👤 New Onboarding', text: 'Rahul Sharma is joining Engineering as a Software Intern on October 10.' },
    { label: '📋 Extract Meeting Ops', text: 'Meeting notes: Omkar will finish the API by Friday. Priya will prepare the presentation by Wednesday. Alex will configure VPN credentials tomorrow.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-white">
              AI Conversational Agent
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              Gemini 2.0 Flash + Tool Calling
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real automated tool execution: Supabase state, approvals, SLA checks & Google Workspace
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col h-[560px] overflow-hidden">
        
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex gap-3 text-xs sm:text-sm ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white shadow-md shadow-indigo-600/30">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2.5 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl rounded-tr-sm shadow-md'
                  : msg.isError
                  ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200 p-4 rounded-2xl rounded-tl-sm'
                  : 'bg-slate-800/80 border border-slate-700/70 text-slate-100 p-4 rounded-2xl rounded-tl-sm'
              }`}>
                <div 
                  className="leading-relaxed whitespace-pre-wrap font-medium"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                />

                {/* Tool Calls Execution Trace */}
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <details className="mt-2 text-xs bg-slate-900/90 rounded-xl p-3 border border-indigo-500/30 group">
                    <summary className="font-bold text-indigo-400 flex items-center justify-between cursor-pointer">
                      <span className="flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Tool Executions ({msg.toolCalls.length})</span>
                      </span>
                      <span className="text-[10px] text-slate-500 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-800">
                      {msg.toolCalls.map((tc, j) => (
                        <div 
                          key={j} 
                          className={`p-2.5 rounded-lg text-xs flex items-start justify-between gap-2 ${
                            tc.success ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border border-rose-500/30 text-rose-300'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            {tc.success ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <span className="font-mono font-bold">{tc.tool}</span>
                              {tc.summary && <p className="text-[11px] text-slate-300 mt-0.5">{tc.summary}</p>}
                              {tc.error && <p className="text-[11px] text-rose-400 mt-0.5 font-mono">{tc.error}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                            {tc.success ? 'OK' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3 text-xs sm:text-sm justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 text-white animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/70 text-slate-300 p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                <span className="text-xs text-indigo-300 font-semibold animate-pulse">
                  Gemini Agent analyzing prompt & executing operational tools...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEnd} />
        </div>

        {/* Quick Action Chips */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2 scrollbar-none">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(qa.text);
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs font-semibold whitespace-nowrap border border-slate-700/60 transition cursor-pointer"
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instruct NEXUS AI to approve, order, assign, search Drive, schedule, or dispatch..."
            disabled={sending}
            className="flex-1 bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 resize-none font-medium"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold disabled:opacity-40 transition active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </div>
  );
}

function formatMessage(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-200 font-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono text-[11px]">$1</code>')
    .replace(/\n/g, '<br/>');
}
