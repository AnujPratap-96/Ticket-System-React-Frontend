import { useCallback, useEffect, useState } from 'react';
import { Timer, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

/** Staff-only: how long was spent on this ticket. Customers never see it. */
export default function TimePanel({ ticketId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ minutes: '', note: '', billable: true });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/tickets/${ticketId}/time`).then((r) => setData(r.data)).catch(() => setData(null));
  }, [ticketId]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/tickets/${ticketId}/time`, { minutes: Number(form.minutes), note: form.note || null, billable: form.billable });
      setForm({ minutes: '', note: '', billable: true });
      load();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    try { await api.delete(`/tickets/${ticketId}/time/${id}`); load(); } catch (err) { toast.error(errorMessage(err)); }
  };

  if (!data) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" />Time spent{data.total_minutes > 0 && <span className="ml-auto normal-case tracking-normal font-semibold text-slate-700">{hm(data.total_minutes)}{data.billable_minutes !== data.total_minutes && ` (${hm(data.billable_minutes)} billable)`}</span>}</h2>
      {data.entries.length > 0 && (
        <ul className="divide-y divide-slate-100 mb-3 text-sm">
          {data.entries.map((e) => (
            <li key={e.id} className="py-1.5 flex items-start gap-2">
              <span className="font-semibold text-slate-800 w-14 shrink-0">{hm(e.minutes)}</span>
              <span className="flex-1 min-w-0 text-slate-600 break-words">{e.note || <em className="text-slate-400">no note</em>}<span className="block text-xs text-slate-400">{e.user?.name}{!e.billable && ' · not billable'}</span></span>
              {(e.user?.id === user.id || user.role === 'admin') && <button onClick={() => remove(e.id)} aria-label="Remove time entry" className="text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="space-y-2">
        <div className="flex gap-2">
          <input type="number" min={1} max={1440} required aria-label="Minutes" placeholder="Minutes" value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} className="w-24 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
          <input maxLength={255} aria-label="What was done" placeholder="What was done (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="flex-1 min-w-0 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs text-slate-600"><input type="checkbox" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} />Billable</label>
          <button disabled={busy || !form.minutes} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">Log time</button>
        </div>
      </form>
    </div>
  );
}
