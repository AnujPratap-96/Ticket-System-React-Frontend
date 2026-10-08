import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, PlusCircle, Search, X } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge, PriorityBadge } from '../../components/common/Badges';
import { useChannel } from '../../lib/realtime';
import SlaBadge from '../../components/sla/SlaBadge';
import NewTicketModal from './NewTicketModal';
import { PRIORITIES, STATUSES, fmt, label } from '../../lib';

export default function TicketListPage() {
  const { user, isStaff } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', tag: '', mine: false });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const reqId = useRef(0);
  const [views, setViews] = useState([]);
  const [selected, setSelected] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    if (isStaff) api.get('/saved-views').then((r) => setViews(r.data.views)).catch(() => {});
  }, [isStaff]);

  const hasFilters = !!(filters.status || filters.priority || filters.search || filters.tag || filters.mine);
  const applyView = (v) => {
    const f = v.filters || {};
    setFilters({ status: f.status || '', priority: f.priority || '', search: f.search || '', tag: f.tag || '', mine: f.assigned_to === 'me' });
    setPage(1);
  };
  const saveView = async () => {
    const name = window.prompt('Name this view (e.g. "My urgent")');
    if (!name?.trim()) return;
    const f = {};
    if (filters.status) f.status = filters.status;
    if (filters.priority) f.priority = filters.priority;
    if (filters.search) f.search = filters.search;
    if (filters.tag) f.tag = filters.tag;
    if (filters.mine) f.assigned_to = 'me';
    try {
      const res = await api.post('/saved-views', { name: name.trim(), filters: f });
      setViews((v) => [...v, res.data.view].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`"${name.trim()}" was saved.`, 'View saved');
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const deleteView = async (v) => {
    try {
      await api.delete(`/saved-views/${v.id}`);
      setViews((all) => all.filter((x) => x.id !== v.id));
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const bulk = async (body, doneLabel) => {
    setBulkBusy(true);
    try {
      const res = await api.post('/tickets/bulk', { ids: selected, ...body });
      const failed = res.data.failed || [];
      if (failed.length) toast.error(`${failed.length} could not be changed: ${failed[0].reason}`, res.data.message);
      else toast.success(res.data.message, doneLabel);
      setSelected([]);
      load();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBulkBusy(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(filters.search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [filters.search]);

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const params = { page };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.mine) params.assigned_to = 'me';
      if (filters.tag) params.tag = filters.tag;
      const res = await api.get('/tickets', { params });
      setSelected([]);
      if (id !== reqId.current) return; // a newer request superseded this one
      setTickets(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch (err) {
      if (id === reqId.current) toast.error(errorMessage(err, 'Failed to load tickets'));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [page, filters.status, filters.priority, filters.mine, filters.tag, debouncedSearch, toast]);

  useEffect(() => { load(); }, [load]);
  // New or changed tickets show up without a refresh (a short pause avoids reloading for every ping).
  const pingTimer = useRef(null);
  useChannel(`user.${user.id}`, { 'ticket.changed': () => { clearTimeout(pingTimer.current); pingTimer.current = setTimeout(load, 600); } });

  const setFilter = (patch) => { setFilters((f) => ({ ...f, ...patch })); setPage(1); };
  const sel = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input aria-label="Search tickets" placeholder="Search number or title" value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} className={`${sel} pl-9`} />
          </div>
          <select aria-label="Filter by status" className={sel} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <select aria-label="Filter by priority" className={sel} value={filters.priority} onChange={(e) => setFilter({ priority: e.target.value })}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
          {isStaff && <input aria-label="Filter by tag" placeholder="Tag" value={filters.tag} onChange={(e) => setFilter({ tag: e.target.value.trim().toLowerCase() })} className={`${sel} w-28`} />}
          {isStaff && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={filters.mine} onChange={(e) => setFilter({ mine: e.target.checked })} /> Assigned to me
            </label>
          )}
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          <PlusCircle className="w-4 h-4" />Submit Ticket
        </button>
      </div>

      {isStaff && (views.length > 0 || hasFilters) && (
        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
          <Bookmark className="w-4 h-4 text-slate-400" aria-hidden="true" />
          {views.map((v) => (
            <span key={v.id} className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              <button onClick={() => applyView(v)} className="pl-3 pr-1.5 py-1 font-medium">{v.name}</button>
              <button onClick={() => deleteView(v)} aria-label={`Delete view ${v.name}`} className="pr-2 py-1 text-indigo-400 hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
            </span>
          ))}
          {hasFilters && <button onClick={saveView} className="text-indigo-600 font-semibold hover:underline">Save current filters as a view</button>}
        </div>
      )}

      {isStaff && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-slate-800 text-sm" role="region" aria-label="Bulk actions">
          <strong>{selected.length} selected</strong>
          <select aria-label="Change status" disabled={bulkBusy} defaultValue="" onChange={(e) => { if (e.target.value) bulk({ action: 'status', status: e.target.value }, 'Status updated'); e.target.value = ''; }} className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-1">
            <option value="">Set status…</option>{STATUSES.map((st) => <option key={st} value={st}>{label(st)}</option>)}
          </select>
          <select aria-label="Change priority" disabled={bulkBusy} defaultValue="" onChange={(e) => { if (e.target.value) bulk({ action: 'priority', priority: e.target.value }, 'Priority updated'); e.target.value = ''; }} className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-1">
            <option value="">Set priority…</option>{PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
          </select>
          {user.role !== 'admin' && <button disabled={bulkBusy} onClick={() => bulk({ action: 'assign', agent_id: user.id }, 'Assigned to you')} className="bg-indigo-500 hover:bg-indigo-400 rounded-lg px-3 py-1 font-semibold">Assign to me</button>}
          <button onClick={() => setSelected([])} className="ml-auto font-semibold text-slate-500 hover:text-slate-900">Clear</button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100" aria-busy={loading}>
        {tickets.length === 0 && !loading && <div className="p-8 text-center text-sm text-slate-500">No tickets found.</div>}
        {tickets.map((t) => (
          <div key={t.id} className="flex items-stretch hover:bg-slate-50">
            {isStaff && (
              <label className="flex items-center pl-4 pr-1 cursor-pointer">
                <input type="checkbox" aria-label={`Select ${t.ticket_number}`} checked={selected.includes(t.id)} onChange={() => setSelected((sel) => (sel.includes(t.id) ? sel.filter((x) => x !== t.id) : [...sel, t.id]))} />
              </label>
            )}
          <Link to={`/staff/tickets/${t.id}`} className="block p-4 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 font-mono">{t.ticket_number} · {t.department?.name}</div>
                <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {user.role !== 'customer' && <>by {t.customer?.name} · </>}
                  {t.assigned_agent ? `assigned to ${t.assigned_agent.name}` : 'unassigned'} · {fmt(t.created_at)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex gap-1.5">{t.ai?.urgent && <span title="Looks urgent" className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">⚡ Urgent</span>}{t.ai?.sentiment === 'negative' && <span title="Customer sounds upset" className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800">😠</span>}<PriorityBadge priority={t.priority} /><StatusBadge status={t.status} /></div>
                {t.status !== 'closed' && <div className="flex gap-1.5">{(t.sla_deadlines || []).map((d) => <SlaBadge key={d.id} deadline={d} />)}</div>}
              </div>
            </div>
          </Link>
          </div>
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
          <span>Page {meta.current_page} of {meta.last_page} · {meta.total} tickets</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Previous</button>
            <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-slate-300 rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showCreate && (
        <NewTicketModal onClose={() => setShowCreate(false)} onCreated={(t) => { setShowCreate(false); navigate(`/staff/tickets/${t.id}`); }} />
      )}
    </div>
  );
}
