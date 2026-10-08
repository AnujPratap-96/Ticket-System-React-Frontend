import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/Badges';
import { useAuth } from '../../context/AuthContext';
import { useT } from '../../context/PreferencesContext';
import { useChannel } from '../../lib/realtime';
import { STATUSES, fmt, label } from '../../lib';

export default function PortalTicketsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const t = useT();
  const [view, setView] = useState('company');
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useChannel(`user.${user.id}`, { 'ticket.changed': () => setTick((n) => n + 1) });

  useEffect(() => {
    let live = true;
    if (tick === 0) setLoading(true);
    api.get('/tickets', { params: { page, ...(status && { status }), ...(user.is_org_admin && view === 'mine' && { scope: 'mine' }) } })
      .then((res) => { if (live) { setTickets(res.data.data || []); setMeta(res.data.meta || null); } })
      .catch((err) => toast.error(errorMessage(err, 'Failed to load tickets')))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [page, status, view, user.is_org_admin, toast, tick]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{user.is_org_admin && view === 'company' ? t('portal.companyTickets') : t('portal.myTickets')}</h1>
          {user.is_org_admin && (
            <div className="mt-2 inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold" role="tablist" aria-label="Ticket scope">
              {[['company', t('portal.wholeCompany')], ['mine', t('portal.onlyMine')]].map(([v, l]) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => { setView(v); setPage(1); }} className={`px-3 py-1.5 rounded-lg ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{l}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <Link to="/portal/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Create ticket</Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100" aria-busy={loading}>
        {!loading && tickets.length === 0 && <div className="p-10 text-center text-sm text-slate-500">{t('portal.empty')} <Link to="/portal/new" className="text-indigo-600 font-semibold">{t('portal.createFirst')}</Link>.</div>}
        {tickets.map((t) => (
          <Link key={t.id} to={`/portal/tickets/${t.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
            <div className="min-w-0">
              <div className="text-xs text-slate-500 font-mono">{t.ticket_number}</div>
              <div className="font-semibold text-slate-900 truncate">{t.title}</div>
              <div className="text-xs text-slate-500">{user.is_org_admin && t.customer && t.customer.id !== user.id ? `${t.customer.name} · ` : ''}{t.department?.name} · {fmt(t.created_at)}</div>
            </div>
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Previous</button>
            <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
