import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { label } from '../../lib';

const dur = (m) => (m >= 1440 && m % 1440 === 0 ? `${m / 1440} d` : m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);

/** What the customer's support plan promises, and how it went over the last 90 days. */
export default function PortalSlaPage() {
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/me/sla').then((r) => setData(r.data)).catch((e) => toast.error(errorMessage(e))); }, [toast]);
  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  const s = data.last_90_days;
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600" />Your support plan</h1>
        <p className="text-sm text-slate-500">{data.organization ? `${data.organization} is on the ` : 'You are on the '}<strong>{label(data.plan)}</strong> plan. These are the times we commit to.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="text-left p-3">Priority</th><th className="text-left p-3">First response within</th><th className="text-left p-3">Resolution within</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data.targets.map((t) => (
              <tr key={t.priority}><td className="p-3 font-medium">{label(t.priority)}</td><td className="p-3">{dur(t.first_response_minutes)}</td><td className="p-3">{dur(t.resolution_minutes)}</td></tr>
            ))}
          </tbody>
        </table>
        {data.targets.some((t) => t.business_hours_only) && <p className="text-xs text-slate-500 px-3 py-2 border-t border-slate-100">Some targets only count during business hours.</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[['Tickets (90 days)', s.tickets], ['Answered', s.answered], ['Resolved', s.resolved], ['Met our targets', s.within_targets == null ? '—' : `${s.within_targets}%`]].map(([k, v]) => (
          <div key={k} className="bg-white border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-bold text-slate-900">{v}</div></div>
        ))}
      </div>
    </div>
  );
}
