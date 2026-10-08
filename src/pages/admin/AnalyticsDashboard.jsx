import React, { useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import TrendChart from '../../components/common/TrendChart';
import SatisfactionPanel from '../../components/common/SatisfactionPanel';
import { downloadFile } from '../../lib/download';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, AlertOctagon, Users, Activity, Clock, Star } from 'lucide-react';

export default function AnalyticsDashboard() {
  const toast = useToast();
  const [trends, setTrends] = useState(null);
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [overview, setOverview] = useState(null);
  const [csat, setCsat] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ovRes, wlRes, trRes, csRes] = await Promise.all([
        api.get('/analytics/sla-overview'),
        api.get('/analytics/agent-workload'),
        api.get('/analytics/trends', { params: { days } }),
        api.get('/analytics/satisfaction', { params: { days } }),
      ]);
      setCsat(csRes.data);
      setTrends(trRes.data);
      setOverview(ovRes.data);
      setWorkload(wlRes.data.workload || []);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load analytics'));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [days]);

  const exportCsv = async () => {
    setExporting(true);
    try { await downloadFile('/tickets-export', 'tickets.csv'); toast.success('tickets.csv was saved to your downloads.', 'Export ready'); } catch (err) { toast.error(errorMessage(err, 'Export failed')); } finally { setExporting(false); }
  };

  const fmtMin = (m) => (m == null ? '—' : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading real-time enterprise metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Compliance</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {overview?.compliance_rate_percentage ?? 100}%
          </div>
          <div className="text-xs text-emerald-700 mt-1">Target contract: 95.0%</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Breaches</span>
            <AlertOctagon className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-600">
            {overview?.breached_count ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total tracked: {overview?.total_sla_tracked ?? 0}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">At-Risk Deadlines</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-600">
            {overview?.at_risk_deadlines_count ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">Due within next 60 minutes</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Satisfaction</span>
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{overview?.csat_average != null ? `${overview.csat_average} / 5` : '—'}</div>
          <div className="text-xs text-slate-500 mt-1">{overview?.csat_count ?? 0} rating(s)</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Backlog</span>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {(overview?.tickets_summary?.open ?? 0) + (overview?.tickets_summary?.in_progress ?? 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overview?.tickets_summary?.open ?? 0} unassigned / {overview?.tickets_summary?.in_progress ?? 0} active
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Ticket volume</h2>
          <div className="flex items-center gap-2">
            <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white">
              {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
            </select>
            <button onClick={exportCsv} disabled={exporting} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{exporting ? 'Exporting…' : 'Export tickets CSV'}</button>
          </div>
        </div>
        <TrendChart series={trends?.series} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><div className="text-xs text-slate-500">Created</div><div className="font-semibold">{trends?.total_created ?? 0}</div></div>
          <div><div className="text-xs text-slate-500">Resolved</div><div className="font-semibold">{trends?.total_resolved ?? 0}</div></div>
          <div><div className="text-xs text-slate-500">Avg first response</div><div className="font-semibold">{fmtMin(trends?.avg_first_response_minutes)}</div></div>
          <div><div className="text-xs text-slate-500">Avg resolution</div><div className="font-semibold">{fmtMin(trends?.avg_resolution_minutes)}</div></div>
        </div>
      </div>

      <SatisfactionPanel data={csat} />

      {/* Agent Workload Balancer View */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Agent Workload Balancing (Live Dispatch Queue)
            </h3>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-4">
          {workload.map((agent) => (
            <div key={agent.agent_id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm text-slate-900">{agent.name}</span>
                  <span className="text-xs text-slate-500 ml-2">({agent.department})</span>
                </div>
                <div className="text-xs font-medium text-slate-700">
                  {agent.active_tickets} / {agent.max_capacity} tickets ({agent.utilization_percentage}%){agent.csat_average != null && <> · ★ {agent.csat_average}</>}
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    agent.utilization_percentage >= 90
                      ? 'bg-rose-500'
                      : agent.utilization_percentage >= 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, agent.utilization_percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
