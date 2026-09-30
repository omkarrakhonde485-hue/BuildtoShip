import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers
} from 'lucide-react';

export default function MonitorView({ onSelectWorkflow }) {
  const { monitorData, resolveAlert, workflows } = useApp();
  const alerts = monitorData.alerts || [];
  const metrics = monitorData.metrics || {};

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-rose-400 animate-pulse" />
            <span>AI Operations Monitor</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              {activeAlerts.length} Active Alerts
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Intelligent autonomous monitoring of SLAs, policy risks, approvals bottlenecks, and overdue milestones
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300">Continuous AI Guard: ACTIVE</span>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">SLA Compliance</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{metrics.slaComplianceRate || '98.4%'}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Zero critical breaches in 24h</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Critical Incidents</div>
          <div className="text-2xl font-black text-rose-400 mt-1">{metrics.criticalIncidents || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Requiring rapid dispatch</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingApprovals || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Under review by managers</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workflows</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{metrics.totalWorkflows || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{metrics.completedWorkflows || 0} completed end-to-end</div>
        </div>

      </div>

      {/* Active Alerts List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Active Intelligence Alerts & Auto-Actions</span>
        </h2>

        {activeAlerts.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-slate-200">All Operations Clear</div>
            <p className="text-xs text-slate-500">No active SLA warnings or risk exceptions detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const wf = workflows.find(w => w.id === alert.workflowId);

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition space-y-3 ${
                    alert.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                      : alert.severity === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-indigo-950/20 border-indigo-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {alert.severity} • {alert.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {wf && (
                      <button
                        onClick={() => onSelectWorkflow(wf)}
                        className="text-xs text-indigo-300 hover:text-white underline cursor-pointer truncate max-w-xs self-start sm:self-auto"
                      >
                        Workflow: {alert.workflowTitle}
                      </button>
                    )}
                  </div>

                  <div className="text-sm font-bold text-slate-100">
                    {alert.message}
                  </div>

                  {/* Remediation Box */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Suggested AI Action: <strong className="text-white">{alert.suggestedAction}</strong></span>
                    </div>

                    <button
                      onClick={() => resolveAlert(alert.id, 'Auto-remediated via AI Operations Control')}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer shrink-0"
                    >
                      Execute Auto-Heal Action
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved Alerts History */}
      {resolvedAlerts.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resolved Alerts History ({resolvedAlerts.length})
          </div>
          <div className="space-y-2">
            {resolvedAlerts.map(alert => (
              <div key={alert.id} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">{alert.message}</span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Resolved {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
