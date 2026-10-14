import { useCallback, useEffect, useState } from 'react';
import { Building2, LogOut, Plus, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { fmt } from '../../lib';

const field = 'mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

function CreateModal({ onClose, onCreated }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', slug: '', admin_name: '', admin_email: '' });
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const r = await api.post('/platform/tenants', f); toast.success(r.data.message, 'Workspace created'); onCreated(); }
    catch (err) { toast.error(errorMessage(err)); setBusy(false); }
  };

  return (
    <Modal title="Create a workspace" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Company name<input required minLength={2} className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, ...(touched ? {} : { slug: slugify(e.target.value) }) })} /></label>
        <label className="block text-sm font-medium text-slate-700">Address<input className={field} value={f.slug} onChange={(e) => { setTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} placeholder="generated from the name" /></label>
        <label className="block text-sm font-medium text-slate-700">First administrator's name<input required minLength={2} className={field} value={f.admin_name} onChange={(e) => setF({ ...f, admin_name: e.target.value })} /></label>
        <label className="block text-sm font-medium text-slate-700">Their email<input type="email" required className={field} value={f.admin_email} onChange={(e) => setF({ ...f, admin_email: e.target.value })} /></label>
        <p className="text-xs text-slate-500">They get an email invitation and choose their own password.</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-xl border border-slate-300">Cancel</button>
          <button disabled={busy} className="px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60">{busy ? 'Creating…' : 'Create and invite'}</button></div>
      </form>
    </Modal>
  );
}

/** The platform owner's overview: every workspace with counts only. No ticket or customer is ever shown here. */
export default function PlatformPage() {
  const toast = useToast();
  const { user, logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => { api.get('/platform/tenants').then((r) => setRows(r.data.tenants)).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false)); }, [toast]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (t) => {
    if (t.is_active && !window.confirm(`Suspend ${t.name}? Nobody in it will be able to sign in or use the app until you restore it.`)) return;
    try { const r = await api.patch(`/platform/tenants/${t.id}`, { is_active: !t.is_active }); toast.success(r.data.message); load(); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900"><span className="bg-slate-900 text-white p-1.5 rounded-lg"><ShieldCheck className="w-4 h-4" /></span>DeskFlow platform</div>
          <div className="flex items-center gap-3 text-sm text-slate-600"><span className="hidden sm:inline">{user.name}</span><button onClick={logout} aria-label="Sign out" className="p-1.5 rounded hover:bg-slate-100"><LogOut className="w-4 h-4" /></button></div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" />Workspaces</h1><p className="text-sm text-slate-500">Each workspace is a separate company with its own people, tickets and settings. You see counts only.</p></div>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" />Create workspace</button>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto" aria-busy={loading}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="text-left p-3">Workspace</th><th className="text-right p-3">Staff</th><th className="text-right p-3">Customers</th><th className="text-right p-3">Tickets</th><th className="text-right p-3">Open</th><th className="text-right p-3">This month</th><th className="text-left p-3">Status</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className={t.is_active ? '' : 'opacity-60'}>
                  <td className="p-3"><div className="font-semibold text-slate-900">{t.name}</div><a href={t.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">{t.slug}</a> <span className="text-xs text-slate-400">· since {fmt(t.created_at).split(',')[0]}</span></td>
                  <td className="p-3 text-right">{t.staff}</td><td className="p-3 text-right">{t.customers}</td><td className="p-3 text-right">{t.tickets}</td><td className="p-3 text-right">{t.open_tickets}</td><td className="p-3 text-right">{t.tickets_this_month}</td>
                  <td className="p-3">{t.is_active ? <span className="text-emerald-700">Active</span> : <span className="text-rose-700 font-medium">Suspended</span>}</td>
                  <td className="p-3 text-right"><button onClick={() => toggle(t)} className={`font-semibold ${t.is_active ? 'text-rose-600' : 'text-emerald-600'}`}>{t.is_active ? 'Suspend' : 'Restore'}</button></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-slate-500">No workspaces yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
      {creating && <CreateModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
    </div>
  );
}
