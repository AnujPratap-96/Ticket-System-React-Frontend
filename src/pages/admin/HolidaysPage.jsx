import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function HolidaysPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ holiday_date: '', name: '' });

  const load = useCallback(() => {
    api.get('/holidays').then((r) => setRows(r.data.holidays || [])).catch((e) => toast.error(errorMessage(e)));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post('/holidays', form);
      toast.success('Holiday added');
      setForm({ holiday_date: '', name: '' });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (h) => {
    if (!window.confirm(`Remove ${h.name} (${h.holiday_date})?`)) return;
    try {
      await api.delete(`/holidays/${h.id}`);
      toast.success('Holiday removed');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const f = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Business holidays</h1>
      <p className="text-sm text-slate-600">SLA clocks do not run on these dates. They apply to deadlines calculated after you add them.</p>
      <form onSubmit={add} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <label className="text-xs font-medium text-slate-600">Date<input type="date" required className={`${f} block mt-1`} value={form.holiday_date} onChange={(e) => setForm({ ...form, holiday_date: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600 flex-1 min-w-40">Name<input required maxLength={150} className={`${f} block mt-1 w-full`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">Add holiday</button>
      </form>
      <ul className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
        {rows.length === 0 && <li className="p-6 text-center text-sm text-slate-500">No holidays configured.</li>}
        {rows.map((h) => (
          <li key={h.id} className="flex items-center justify-between p-3 text-sm">
            <span><span className="font-mono text-xs text-slate-500 mr-3">{h.holiday_date}</span>{h.name}</span>
            <button onClick={() => remove(h)} className="text-rose-600 font-semibold">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
