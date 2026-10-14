import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { fmt } from '../../lib';

const VERBS = { POST: 'Created / ran', PATCH: 'Changed', PUT: 'Changed', DELETE: 'Deleted' };

/** Who changed what in the admin areas (never the values themselves). */
export default function AdminActivityPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get('/admin-activity', { params: { page } }).then((r) => setData(r.data)).catch((e) => toast.error(errorMessage(e)));
  }, [page, toast]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Admin activity</h1>
      <p className="text-sm text-slate-600">Every change made in the admin areas (people, departments, integrations, security…). Ticket history is in the Audit log.</p>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
            <th className="text-left p-3">When</th><th className="text-left p-3">Who</th><th className="text-left p-3">Action</th><th className="text-left p-3">Where</th><th className="text-left p-3">IP</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {data.data.map((a) => (
              <tr key={a.id}>
                <td className="p-3 whitespace-nowrap text-xs text-slate-500">{fmt(a.created_at)}</td>
                <td className="p-3">{a.user ? `${a.user.name}` : 'deleted user'}</td>
                <td className="p-3">{VERBS[a.method] || a.method}</td>
                <td className="p-3 font-mono text-xs">/{a.route}{a.targets ? ` · #${Object.values(a.targets).join(', #')}` : ''}</td>
                <td className="p-3 font-mono text-xs">{a.ip || '—'}</td>
              </tr>
            ))}
            {data.data.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nothing yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Page {data.current_page} of {data.last_page} · {data.total} entries</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Previous</button>
            <button disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
