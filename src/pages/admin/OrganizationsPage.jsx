import { useCallback, useEffect, useState } from 'react';
import { Building, ChevronDown, ChevronRight, Plus, Users } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { label } from '../../lib';
import UsageBar from '../../components/common/UsageBar';

// Plan defaults, shown as placeholders so "empty = plan default" is obvious (the server is the source of truth).
const PLAN_DEFAULTS = { standard: [100, 25, 10], silver: [500, 100, 20], gold: [2000, 500, 50], platinum: [null, null, 100] };

const TIERS = ['standard', 'silver', 'gold', 'platinum'];
const field = 'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';
const TIER_STYLE = { standard: 'bg-slate-100 text-slate-700', silver: 'bg-sky-50 text-sky-700', gold: 'bg-amber-50 text-amber-800', platinum: 'bg-violet-50 text-violet-700' };

function OrgForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const ov = initial?.overrides || {};
  const [form, setForm] = useState(initial
    ? { name: initial.name, domain: initial.domain, sla_tier: initial.sla_tier, is_active: initial.is_active, monthly_ticket_limit: ov.monthly_ticket_limit ?? '', max_customers: ov.max_customers ?? '', max_open_per_customer: ov.max_open_per_customer ?? '' }
    : { name: '', domain: '', sla_tier: 'standard', is_active: true, monthly_ticket_limit: '', max_customers: '', max_open_per_customer: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const body = { ...form };
      ['monthly_ticket_limit', 'max_customers', 'max_open_per_customer'].forEach((k) => { body[k] = body[k] === '' ? null : Number(body[k]); });
      if (initial) await api.patch(`/organizations/${initial.id}`, body);
      else await api.post('/organizations', body);
      toast.success(initial ? `${form.name} was updated.` : `${form.name} was added. Customers with @${form.domain} emails join it automatically.`, initial ? 'Organization updated' : 'Organization created');
      onSaved();
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'Add organization'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Company name
          <input required minLength={2} className={`${field} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {errors.name && <span className="text-xs text-rose-600">{errors.name[0]}</span>}
        </label>
        <label className="block text-sm font-medium text-slate-700">Email domain
          <input required placeholder="acme.com" className={`${field} mt-1`} value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <span className="block text-xs text-slate-500 mt-1">Customers who sign up with an email on this domain join the company automatically.</span>
          {errors.domain && <span className="text-xs text-rose-600">{errors.domain[0]}</span>}
        </label>
        <label className="block text-sm font-medium text-slate-700">Support plan
          <select className={`${field} mt-1`} value={form.sla_tier} onChange={(e) => setForm({ ...form, sla_tier: e.target.value })}>{TIERS.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
          <span className="block text-xs text-slate-500 mt-1">Decides the response and resolution targets for this company's new tickets.</span>
        </label>
        <fieldset className="rounded-xl border border-slate-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Usage limits</legend>
          <p className="text-xs text-slate-500 mb-2">Leave empty to use the plan's default (shown in grey). Type <strong>0</strong> for unlimited.</p>
          <div className="grid grid-cols-3 gap-2">
            {[['monthly_ticket_limit', 'Tickets / month', 0], ['max_customers', 'User accounts', 1], ['max_open_per_customer', 'Open per person', 2]].map(([k, l, i]) => (
              <label key={k} className="text-xs font-medium text-slate-600">{l}
                <input type="number" min="0" className={`${field} mt-1`} value={form[k]} placeholder={PLAN_DEFAULTS[form.sla_tier][i] === null ? 'no limit' : String(PLAN_DEFAULTS[form.sla_tier][i])} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </label>
            ))}
          </div>
        </fieldset>
        {initial && (
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Active (inactive companies no longer auto-join new sign-ups)</label>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm rounded-xl border border-slate-300">Cancel</button>
          <button disabled={busy} className="px-4 py-2.5 text-sm rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

function CustomersPanel({ org }) {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const load = useCallback(() => { api.get(`/organizations/${org.id}/customers`).then((r) => setRows(r.data.customers)).catch((e) => toast.error(errorMessage(e))); }, [org.id, toast]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (c) => {
    try {
      const r = await api.patch(`/organizations/${org.id}/customers/${c.id}`, { is_org_admin: !c.is_org_admin });
      toast.success(r.data.message, 'Company admin updated');
      load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  if (!rows) return <div className="p-4 text-sm text-slate-500">Loading…</div>;
  if (rows.length === 0) return <div className="p-4 text-sm text-slate-500">No customers have joined this company yet.</div>;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
          <span className="min-w-0"><span className="font-medium text-slate-900">{c.name}</span> <span className="text-slate-500">{c.email}</span></span>
          <label className="flex items-center gap-2 text-xs text-slate-600 shrink-0" title="A company admin sees and can reply to every ticket from this company">
            <input type="checkbox" checked={!!c.is_org_admin} onChange={() => toggle(c)} />Company admin
          </label>
        </li>
      ))}
    </ul>
  );
}

export default function OrganizationsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null | {} | org
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [moveTo, setMoveTo] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.get('/organizations', { params: search ? { search } : {} });
      setRows(r.data.organizations);
    } catch (e) { toast.error(errorMessage(e, 'Failed to load organizations')); } finally { setLoading(false); }
  }, [search, toast]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const attach = async (org) => {
    try {
      const r = await api.post(`/organizations/${org.id}/attach-customers`);
      toast.success(r.data.message, r.data.attached ? 'Customers added' : 'Nothing to add');
      load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      const r = await api.delete(`/organizations/${deleting.id}`, { params: moveTo ? { move_to: moveTo } : {} });
      toast.success(r.data.message || 'Organization deleted');
      setDeleting(null);
      setMoveTo('');
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Organizations</h1>
          <p className="text-sm text-slate-500">Customer companies and the support plan their tickets are measured against.</p>
        </div>
        <div className="flex items-center gap-2">
          <input aria-label="Search organizations" placeholder="Search name or domain" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
          <button onClick={() => setForm({})} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" />Add organization</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" aria-busy={loading}>
        {loading && <div className="p-10 text-center text-sm text-slate-500">Loading organizations…</div>}
        {!loading && rows.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-500"><Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />No organizations yet. Add one so its customers get the right plan automatically.</div>
        )}
        {rows.map((o) => (
          <div key={o.id} className="border-b border-slate-100 last:border-0">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <button onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id} aria-label={`Show customers of ${o.name}`} className="p-1 rounded text-slate-400 hover:bg-slate-100">
                {open === o.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900 truncate">{o.name} {!o.is_active && <span className="ml-1 text-xs font-medium text-rose-600">inactive</span>}</div>
                <div className="text-xs text-slate-500">@{o.domain}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TIER_STYLE[o.sla_tier]}`}>{label(o.sla_tier)}</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-600"><Users className="w-3.5 h-3.5" />{o.customers_count}</span>
              <span className="text-xs text-slate-600">{o.tickets_count} {o.tickets_count === 1 ? 'ticket' : 'tickets'}</span>
              <button onClick={() => attach(o)} className="text-xs font-semibold text-indigo-600 hover:underline" title="Link existing customers whose email is on this domain">Add matching customers</button>
              <button onClick={() => setForm(o)} className="text-xs font-semibold text-slate-600 hover:underline">Edit</button>
              <button onClick={() => { setDeleting(o); setMoveTo(''); }} className="text-xs font-semibold text-rose-600 hover:underline">Delete</button>
            </div>
            {o.limits && (
              <div className="grid sm:grid-cols-3 gap-3 px-4 pb-3 pl-12">
                <UsageBar label="Tickets this month" used={o.usage.tickets_this_month} limit={o.limits.monthly_tickets} compact />
                <UsageBar label="User accounts" used={o.usage.customers} limit={o.limits.customers} compact />
                <UsageBar label="Open tickets" used={o.usage.open_tickets} limit={null} compact />
              </div>
            )}
            {open === o.id && <div className="bg-slate-50/70 border-t border-slate-100"><CustomersPanel org={o} /></div>}
          </div>
        ))}
      </div>

      {deleting && (
        <Modal title={`Delete ${deleting.name}?`} onClose={() => setDeleting(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete the organization <strong>{deleting.name}</strong> (@{deleting.domain})?
              Its customers are unlinked (their accounts stay). This cannot be undone.
            </p>
            {deleting.tickets_count > 0 && (
              <label className="block text-sm font-medium text-slate-700">
                It has {deleting.tickets_count} {deleting.tickets_count === 1 ? 'ticket' : 'tickets'}. Move {deleting.tickets_count === 1 ? 'it' : 'them'} to
                <select required className={`${field} mt-1`} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                  <option value="">Choose an organization…</option>
                  {rows.filter((r) => r.id !== deleting.id).map((r) => <option key={r.id} value={r.id}>{r.name} ({label(r.sla_tier)})</option>)}
                </select>
                <span className="block text-xs text-slate-500 mt-1">Open tickets then follow that company's plan and SLA targets.</span>
              </label>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2 text-sm rounded-xl border border-slate-300 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting.tickets_count > 0 && !moveTo} className="px-4 py-2 text-sm rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50">Delete organization</button>
            </div>
          </div>
        </Modal>
      )}

      {form && <OrgForm initial={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
