import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const f = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white w-full';

export default function CannedResponsesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', scope: 'personal' });
  const [editing, setEditing] = useState(null);

  const scopes = [['personal', 'Only me'], ...(user.role !== 'agent' ? [['department', 'My department']] : []), ...(user.role === 'admin' ? [['global', 'Everyone']] : [])];

  const load = useCallback(() => {
    api.get('/canned-responses').then((r) => setRows(r.data.canned_responses || [])).catch((e) => toast.error(errorMessage(e)));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm({ title: '', body: '', scope: 'personal' }); setEditing(null); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.patch(`/canned-responses/${editing}`, { title: form.title, body: form.body });
      else await api.post('/canned-responses', form);
      toast.success('Saved');
      reset();
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    try { await api.delete(`/canned-responses/${r.id}`); toast.success(`"${r.title}" was deleted.`, 'Template deleted'); load(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900">Canned responses</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs font-medium text-slate-600 sm:col-span-2">Title<input required maxLength={150} className={f} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="text-xs font-medium text-slate-600">Available to
            <select disabled={!!editing} className={f} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>{scopes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <label className="block text-xs font-medium text-slate-600">Message
          <textarea required rows={4} maxLength={5000} className={f} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Hi {{customer_name}}, …" /></label>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">Insert placeholder:
          {[['{{customer_name}}', "customer's first name"], ['{{agent_name}}', 'your name'], ['{{agent_title}}', 'your job title'], ['{{signature}}', 'your name and job title']].map(([ph, hint]) => (
            <button type="button" key={ph} title={hint} onClick={() => setForm((f) => ({ ...f, body: `${f.body}${f.body && !f.body.endsWith(' ') && !f.body.endsWith('\n') ? ' ' : ''}${ph}` }))} className="rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-700 hover:bg-slate-50">{ph}</button>
          ))}
          <span>Text can use **bold**, *italic*, - lists and [links](https://…).</span>
        </div>
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">{editing ? 'Update' : 'Add template'}</button>
          {editing && <button type="button" onClick={reset} className="border border-slate-300 px-4 py-2 rounded-lg text-sm">Cancel</button>}
        </div>
      </form>

      <ul className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
        {rows.length === 0 && <li className="p-6 text-center text-sm text-slate-500">No templates yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-slate-900">{r.title} <span className="ml-2 text-[11px] uppercase text-slate-400">{r.scope}</span></div>
              {r.can_manage && (
                <div className="text-sm whitespace-nowrap">
                  <button onClick={() => { setEditing(r.id); setForm({ title: r.title, body: r.body, scope: r.scope }); }} className="text-indigo-600 font-semibold mr-3">Edit</button>
                  <button onClick={() => remove(r)} className="text-rose-600 font-semibold">Delete</button>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap line-clamp-3">{r.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
