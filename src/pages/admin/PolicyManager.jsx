import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { PRIORITIES, label } from '../../lib';

const TIERS = ['standard', 'silver', 'gold', 'platinum'];

export default function PolicyManager() {
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({ tier: 'standard', priority: 'medium', name: '', first_response_time_minutes: 120, resolution_time_minutes: 1440, applies_business_hours_only: true });

  const load = useCallback(() => {
    api.get('/sla-policies')
      .then((r) => setPolicies(r.data.policies || []))
      .catch((e) => toast.error(errorMessage(e, 'Failed to load policies')));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sla-policies', {
        ...form,
        name: form.name || `${label(form.tier)} - ${label(form.priority)}`,
        first_response_time_minutes: Number(form.first_response_time_minutes),
        resolution_time_minutes: Number(form.resolution_time_minutes),
      });
      toast.success('SLA policy saved');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const edit = (p) => setForm({
    tier: p.tier, priority: p.priority, name: p.name,
    first_response_time_minutes: p.first_response_time_minutes,
    resolution_time_minutes: p.resolution_time_minutes,
    applies_business_hours_only: !!p.applies_business_hours_only,
  });

  const f = 'border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white w-full';

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
        <label className="text-xs font-medium text-slate-600">Tier
          <select className={f} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })}>{TIERS.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Priority
          <select className={f} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">First response (min)
          <input type="number" min={5} className={f} value={form.first_response_time_minutes} onChange={(e) => setForm({ ...form, first_response_time_minutes: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600">Resolution (min)
          <input type="number" min={15} className={f} value={form.resolution_time_minutes} onChange={(e) => setForm({ ...form, resolution_time_minutes: e.target.value })} /></label>
        <label className="text-xs font-medium text-slate-600 flex items-center gap-2 pb-2">
          <input type="checkbox" checked={form.applies_business_hours_only} onChange={(e) => setForm({ ...form, applies_business_hours_only: e.target.checked })} />Business hours only</label>
        <button className="bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold">Save policy</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
            <th className="text-left p-3">Tier</th><th className="text-left p-3">Priority</th><th className="text-left p-3">First response</th><th className="text-left p-3">Resolution</th><th className="text-left p-3">Business hrs</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {policies.map((p) => (
              <tr key={p.id}>
                <td className="p-3">{label(p.tier)}</td><td className="p-3">{label(p.priority)}</td>
                <td className="p-3">{p.first_response_time_minutes} min</td><td className="p-3">{p.resolution_time_minutes} min</td>
                <td className="p-3">{p.applies_business_hours_only ? 'Yes' : '24/7'}</td>
                <td className="p-3 text-right"><button onClick={() => edit(p)} className="text-indigo-600 font-semibold">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
