import { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { label } from '../../lib';

const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';
const ROLES = ['agent', 'lead', 'admin'];

function UserForm({ departments, initial, onClose, onSaved }) {
  const toast = useToast();
  const editing = !!initial;
  const [form, setForm] = useState(initial
    ? { name: initial.name, role: initial.role, department_id: initial.department_id || '', max_active_tickets: initial.max_active_tickets }
    : { name: '', email: '', role: 'agent', department_id: departments[0]?.id || '', max_active_tickets: 10 });
  const [busy, setBusy] = useState(false);
  const needsDept = form.role !== 'admin';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...form, department_id: needsDept ? form.department_id || null : null, max_active_tickets: Number(form.max_active_tickets) };
    try {
      const res = editing ? await api.patch(`/users/${initial.id}`, body) : await api.post('/users', body);
      toast.success(editing ? `${body.name} was updated.` : res.data.message, editing ? 'User updated' : 'Invitation sent');
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? `Edit ${initial.name}` : 'Add team member'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Name
          <input required className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        {!editing && (
          <>
            <label className="block text-sm font-medium text-slate-700">Email
              <input type="email" required className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <p className="text-xs text-slate-500 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">We email an invitation link. The person chooses their own password, so you never need to know it.</p>
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">Role
            <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Capacity
            <input type="number" min={1} max={100} className={input} value={form.max_active_tickets} onChange={(e) => setForm({ ...form, max_active_tickets: e.target.value })} /></label>
        </div>
        {needsDept && (
          <label className="block text-sm font-medium text-slate-700">Department
            <select required className={input} value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}>
              <option value="" disabled>Select…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
          <button disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60">{busy ? 'Saving…' : editing ? 'Save' : 'Send invitation'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function TeamPage() {
  const { user, permissions } = useAuth();
  const toast = useToast();
  const isAdmin = permissions.manage_team;
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // null | {} (new) | user (edit)
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [erasing, setErasing] = useState(null);
  const [confirmEmail, setConfirmEmail] = useState('');

  const load = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([
        api.get('/users', { params: { per_page: 100, ...(search && { search }), ...(roleFilter && { role: roleFilter }) } }),
        api.get('/departments'),
      ]);
      setRows(u.data.data || []);
      setDepartments(d.data.departments || []);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to load team'));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, toast]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const patch = async (u, url, body, ok, method = 'patch') => {
    try {
      await api[method](url, body);
      toast.success(ok);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const erase = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/users/${erasing.id}/erase`, { confirm_email: confirmEmail });
      toast.success(res.data.message, 'Account erased');
      setErasing(null);
      setConfirmEmail('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Team</h1>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white flex-1 sm:flex-initial">
            <option value="">Staff</option><option value="customer">Customers</option><option value="agent">Agents</option><option value="lead">Team leads</option><option value="admin">Admins</option>
          </select>
          <input aria-label="Search team" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 sm:flex-initial min-w-0" />
          {isAdmin && <button onClick={() => setForm({})} className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto shrink-0"><UserPlus className="w-4 h-4" />Add member</button>}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto" aria-busy={loading}>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
            <th className="text-left p-3">Member</th><th className="text-left p-3">Role</th><th className="text-left p-3">Department</th>
            <th className="text-left p-3">Load</th><th className="text-left p-3">Routing</th><th className="text-left p-3">Status</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((m) => (
              <tr key={m.id} className={m.is_active ? '' : 'opacity-60'}>
                <td className="p-3"><div className="font-medium text-slate-900">{m.name}</div><div className="text-xs text-slate-500">{m.email}</div></td>
                <td className="p-3">{label(m.role)}</td>
                <td className="p-3">{m.department?.name || '—'}</td>
                <td className="p-3">
                  {m.role !== 'admin' ? (
                    <div className="flex items-center gap-2">
                      <span>{m.active_tickets_count ?? 0}/</span>
                      <input type="number" min={1} max={100} aria-label={`Capacity for ${m.name}`} defaultValue={m.max_active_tickets} key={`${m.id}-${m.max_active_tickets}`}
                        onBlur={(e) => Number(e.target.value) !== m.max_active_tickets && patch(m, `/users/${m.id}/routing`, { max_active_tickets: Number(e.target.value) }, 'Capacity updated')}
                        className="w-16 border border-slate-300 rounded px-2 py-1 text-sm" />
                    </div>
                  ) : '—'}
                </td>
                <td className="p-3">
                  {m.role !== 'admin' && (
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={m.is_available_for_routing} onChange={(e) => patch(m, `/users/${m.id}/routing`, { is_available_for_routing: e.target.checked }, e.target.checked ? 'Now receiving tickets' : 'Paused from routing')} />
                      Accepting tickets
                    </label>
                  )}
                </td>
                <td className="p-3">
                  {m.invite_status ? <span className={m.invite_status === 'expired' ? 'text-rose-700' : 'text-amber-700'}>{m.invite_status === 'expired' ? 'Invite expired' : 'Invited'}</span>
                    : m.is_active ? <span className="text-emerald-700">Active</span> : <span className="text-rose-700">Deactivated</span>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  {isAdmin && (
                    <>
                      {m.invite_status && <button onClick={() => patch(m, `/users/${m.id}/resend-invite`, null, 'A new invitation was sent', 'post')} className="text-amber-700 font-semibold mr-3">Resend invite</button>}
                      <button onClick={() => setForm(m)} className="text-indigo-600 font-semibold mr-3">Edit</button>
                      {m.id !== user.id && (
                        <button onClick={() => { setErasing(m); setConfirmEmail(''); }} className="text-slate-500 hover:text-rose-700 font-semibold mr-3">Erase</button>
                      )}
                      {m.id !== user.id && (
                        <button onClick={() => patch(m, `/users/${m.id}`, { is_active: !m.is_active }, m.is_active ? 'User deactivated' : 'User reactivated')} className={m.is_active ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                          {m.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-500">No team members found.</td></tr>}
          </tbody>
        </table>
      </div>

      {erasing && (
        <Modal title={`Erase ${erasing.name}?`} onClose={() => setErasing(null)}>
          <form onSubmit={erase} className="space-y-4">
            <p className="text-sm text-slate-600">This removes the person's name, email, photo and sign-ins for good{erasing.role === 'customer' ? ', and deletes the text they wrote in tickets' : ', and returns their tickets to the unassigned pool'}. This cannot be undone.</p>
            <label className="block text-sm font-medium text-slate-700">Type <strong>{erasing.email}</strong> to confirm
              <input required autoFocus className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setErasing(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
              <button disabled={confirmEmail.toLowerCase() !== erasing.email.toLowerCase()} className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-50">Erase permanently</button>
            </div>
          </form>
        </Modal>
      )}
      {form && <UserForm departments={departments} initial={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
