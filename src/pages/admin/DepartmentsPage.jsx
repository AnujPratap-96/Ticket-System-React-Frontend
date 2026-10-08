import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import FormBuilder from '../../components/ticket/FormBuilder';

const f = 'border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white w-full';
const blank = { name: '', slug: '', description: '', business_hours_start: '09:00', business_hours_end: '18:00', timezone: 'UTC', form_fields: [] };
const hhmm = (t) => (t || '').slice(0, 5);

export default function DepartmentsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const zones = typeof Intl.supportedValuesOf === 'function' ? ['UTC', ...Intl.supportedValuesOf('timeZone')] : ['UTC'];

  const load = useCallback(() => {
    api.get('/departments').then((r) => setRows(r.data.departments || [])).catch((e) => toast.error(errorMessage(e)));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.patch(`/departments/${editingId}`, form);
      else await api.post('/departments', form);
      toast.success(editingId ? 'Department updated' : 'Department created');
      setForm(blank);
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const edit = (d) => {
    setEditingId(d.id);
    setForm({ name: d.name, slug: d.slug, description: d.description || '', business_hours_start: hhmm(d.business_hours_start), business_hours_end: hhmm(d.business_hours_end), timezone: d.timezone, form_fields: d.form_fields || [] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Departments</h1>
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <label className="text-xs font-medium text-slate-600">Name<input required className={f} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600">Slug<input required pattern="[a-z0-9-]+" title="lowercase letters, numbers, dashes" className={f} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600">Opens<input type="time" required className={f} value={form.business_hours_start} onChange={(e) => setForm({ ...form, business_hours_start: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600">Closes<input type="time" required className={f} value={form.business_hours_end} onChange={(e) => setForm({ ...form, business_hours_end: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600">Timezone
          <select className={f} value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>{zones.map((z) => <option key={z} value={z}>{z}</option>)}</select></label>
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold flex-1">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blank); }} className="border border-slate-300 rounded-lg px-3 text-sm">Cancel</button>}
        </div>
      </div>
      <FormBuilder fields={form.form_fields} onChange={(ff) => setForm({ ...form, form_fields: ff })} />
      </form>
      <p className="text-xs text-slate-500">Changing hours or timezone applies to tickets created afterwards; deadlines already calculated are not rewritten.</p>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Slug</th><th className="text-left p-3">Hours</th><th className="text-left p-3">Timezone</th><th className="text-left p-3">Form</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => (
              <tr key={d.id}><td className="p-3 font-medium">{d.name}</td><td className="p-3 font-mono text-xs">{d.slug}</td><td className="p-3">{hhmm(d.business_hours_start)}–{hhmm(d.business_hours_end)}</td><td className="p-3">{d.timezone}</td><td className="p-3 text-slate-500">{d.form_fields?.length ? `${d.form_fields.length} questions` : '—'}</td>
                <td className="p-3 text-right"><button onClick={() => edit(d)} className="text-indigo-600 font-semibold">Edit</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
