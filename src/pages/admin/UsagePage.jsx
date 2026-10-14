import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import UsageBar from '../../components/common/UsageBar';
import { label } from '../../lib';

/** Admin overview: which companies are close to their plan limits, and platform-wide usage. */
export default function UsagePage() {
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/usage').then((r) => setData(r.data)).catch((e) => toast.error(errorMessage(e))); }, [toast]);
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Gauge className="w-5 h-5 text-indigo-600" />Usage and limits</h1>
        <p className="text-sm text-slate-500">{data.month}. Companies closest to a limit are first. Change a company's limits under <Link to="/staff/organizations" className="text-indigo-600 font-semibold">Organizations</Link>.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
        {data.organizations.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No organizations yet.</p>}
        {data.organizations.map((o) => (
          <div key={o.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="font-semibold text-slate-900">{o.name} <span className="ml-1 text-xs font-medium text-slate-500">{label(o.plan)}</span></div>
              {o.percent >= 100 ? <span className="text-xs font-semibold text-rose-600">Limit reached</span> : o.percent >= 80 ? <span className="text-xs font-semibold text-amber-600">Almost full</span> : null}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <UsageBar label="Tickets this month" used={o.usage.tickets_this_month} limit={o.limits.monthly_tickets} />
              <UsageBar label="User accounts" used={o.usage.customers} limit={o.limits.customers} />
              <UsageBar label="Open tickets" used={o.usage.open_tickets} limit={null} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">AI assistant today</h2>
          <UsageBar label={data.ai.enabled ? 'AI calls' : 'AI calls (assistant is off)'} used={data.ai.calls_today} limit={data.ai.daily_limit} />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Platform</h2>
          {data.platform.map((p) => <UsageBar key={p.label} label={p.label} used={p.used} limit={p.limit} />)}
        </div>
      </div>

      <p className="text-xs text-slate-500">Anti-flood limits per person: {data.rates.tickets_per_minute} new tickets a minute (max {data.rates.tickets_per_hour} an hour) and {data.rates.messages_per_minute} replies a minute. They are set in <code>config/plans.php</code>.</p>
    </div>
  );
}
