import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { fmt } from '../../lib';

export default function AuditLogPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ event_type: '', ticket: '', from: '', to: '' });

  const load = useCallback(async () => {
    try {
      const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get('/audits', { params });
      setRows(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load audit log'));
    }
  }, [page, filters, toast]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const f = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';
  const set = (patch) => { setFilters((x) => ({ ...x, ...patch })); setPage(1); };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Audit log</h1>
      <div className="flex flex-wrap gap-2">
        <input aria-label="Event type" placeholder="Event (e.g. status_transition)" className={f} value={filters.event_type} onChange={(e) => set({ event_type: e.target.value })} />
        <input aria-label="Ticket number" placeholder="Ticket number" className={f} value={filters.ticket} onChange={(e) => set({ ticket: e.target.value })} />
        <input aria-label="From date" type="date" className={f} value={filters.from} onChange={(e) => set({ from: e.target.value })} />
        <input aria-label="To date" type="date" className={f} value={filters.to} onChange={(e) => set({ to: e.target.value })} />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
            <th className="text-left p-3">When</th><th className="text-left p-3">Ticket</th><th className="text-left p-3">Event</th><th className="text-left p-3">Change</th><th className="text-left p-3">Actor</th><th className="text-left p-3">IP</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="p-3 whitespace-nowrap text-xs text-slate-500">{fmt(a.created_at)}</td>
                <td className="p-3"><Link to={`/staff/tickets/${a.ticket_id}`} className="text-indigo-600 font-mono text-xs">{a.ticket_number}</Link></td>
                <td className="p-3">{a.event_type.replace(/_/g, ' ')}</td>
                <td className="p-3 text-xs">{a.field_name ? `${a.field_name}: ${a.old_value ?? '—'} → ${a.new_value ?? '—'}` : (a.new_value ?? '')}</td>
                <td className="p-3">{a.actor ? `${a.actor.name} (${a.actor.role})` : 'system'}</td>
                <td className="p-3 font-mono text-xs">{a.ip_address || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No audit entries match.</td></tr>}
          </tbody>
        </table>
      </div>
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {meta.current_page} of {meta.last_page} · {meta.total} entries</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Previous</button>
            <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
