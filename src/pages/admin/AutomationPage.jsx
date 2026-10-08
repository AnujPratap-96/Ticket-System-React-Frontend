import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { PRIORITIES, STATUSES, label } from '../../lib';

const TRIGGERS = { ticket_created: 'a ticket is created', customer_replied: 'a customer replies', idle: 'a ticket has been quiet for…' };
const FIELDS = {
  title: 'Title', description: 'Message', priority: 'Priority', status: 'Status', department_id: 'Department',
  channel: 'Channel', organization_tier: 'Customer plan', assigned: 'Has an owner',
};
const CHOICES = {
  priority: PRIORITIES, status: STATUSES, channel: ['portal', 'email', 'api'], organization_tier: ['standard', 'silver', 'gold', 'platinum'], assigned: ['yes', 'no'],
};
const ACTIONS = { set_priority: 'Set priority', add_tag: 'Add tag', assign_to: 'Assign to', set_status: 'Set status', add_note: 'Add internal note' };
const f = 'border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white';

const describe = (r, deps, agents) => {
  const cond = r.conditions.map((c) => `${FIELDS[c.field].toLowerCase()} ${c.op.replace('_', ' ')} “${c.field === 'department_id' ? deps.find((d) => String(d.id) === c.value)?.name || c.value : c.value}”`).join(' and ');
  const acts = r.actions.map((a) => `${ACTIONS[a.type].toLowerCase()} ${a.type === 'assign_to' ? agents.find((u) => String(u.id) === a.value)?.name || a.value : `“${a.value}”`}`).join(', ');
  return `When ${TRIGGERS[r.trigger].replace('…', `${r.idle_hours || '…'} hours`)}${cond ? ` and ${cond}` : ''}: ${acts}.`;
};

function RuleForm({ initial, deps, agents, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(initial || { name: '', trigger: 'ticket_created', idle_hours: 24, conditions: [], actions: [{ type: 'add_tag', value: '' }] });
  const [busy, setBusy] = useState(false);
  const setCond = (i, p) => setForm((x) => ({ ...x, conditions: x.conditions.map((c, k) => (k === i ? { ...c, ...p } : c)) }));
  const setAct = (i, p) => setForm((x) => ({ ...x, actions: x.actions.map((a, k) => (k === i ? { ...a, ...p } : a)) }));

  const valueInput = (c, i) => {
    const opts = c.field === 'department_id' ? deps.map((d) => [String(d.id), d.name]) : CHOICES[c.field]?.map((v) => [v, label(v)]);
    return opts
      ? <select required className={f} value={c.value} onChange={(e) => setCond(i, { value: e.target.value })}><option value="">Choose…</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      : <input required maxLength={200} className={`${f} w-full`} placeholder="text" value={c.value} onChange={(e) => setCond(i, { value: e.target.value })} />;
  };
  const actionValue = (a, i) => {
    if (a.type === 'set_priority') return <select required className={f} value={a.value} onChange={(e) => setAct(i, { value: e.target.value })}><option value="">Choose…</option>{PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>;
    if (a.type === 'set_status') return <select required className={f} value={a.value} onChange={(e) => setAct(i, { value: e.target.value })}><option value="">Choose…</option>{STATUSES.map((p) => <option key={p} value={p}>{label(p)}</option>)}</select>;
    if (a.type === 'assign_to') return <select required className={f} value={a.value} onChange={(e) => setAct(i, { value: e.target.value })}><option value="">Choose…</option>{agents.map((u) => <option key={u.id} value={u.id}>{u.name}{u.department ? ` (${u.department.name})` : ''}</option>)}</select>;
    return <input required maxLength={a.type === 'add_tag' ? 30 : 500} className={`${f} w-full`} placeholder={a.type === 'add_tag' ? 'tag' : 'note text'} value={a.value} onChange={(e) => setAct(i, { value: e.target.value })} />;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...form, idle_hours: form.trigger === 'idle' ? Number(form.idle_hours) : null };
      if (initial?.id) await api.patch(`/automation-rules/${initial.id}`, body); else await api.post('/automation-rules', body);
      toast.success(`“${form.name}” was saved.`, 'Rule saved');
      onSaved();
    } catch (err) { toast.error(errorMessage(err)); setBusy(false); }
  };

  return (
    <Modal title={initial?.id ? 'Edit rule' : 'New automation rule'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Name
          <input required minLength={2} maxLength={120} className={`${f} mt-1 w-full`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Escalate outages" />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-slate-700">When</span>
          <select aria-label="Trigger" className={f} value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>{Object.entries(TRIGGERS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          {form.trigger === 'idle' && <><input aria-label="Idle hours" type="number" min="1" max="720" required className={`${f} w-20`} value={form.idle_hours} onChange={(e) => setForm({ ...form, idle_hours: e.target.value })} /><span>hours</span></>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Only if <span className="text-slate-400 font-normal">(all must match)</span></span>
            <button type="button" onClick={() => setForm({ ...form, conditions: [...form.conditions, { field: 'title', op: 'contains', value: '' }] })} className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add condition</button></div>
          {form.conditions.length === 0 && <p className="text-xs text-slate-500">No conditions: applies to every ticket.</p>}
          {form.conditions.map((c, i) => {
            const exact = !['title', 'description'].includes(c.field);
            return (
              <div key={i} className="flex flex-wrap gap-2 items-center">
                <select aria-label="Field" className={f} value={c.field} onChange={(e) => setCond(i, { field: e.target.value, value: '', op: ['title', 'description'].includes(e.target.value) ? 'contains' : 'is' })}>{Object.entries(FIELDS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                <select aria-label="Operator" className={f} value={c.op} onChange={(e) => setCond(i, { op: e.target.value })}>
                  {(exact ? [['is', 'is'], ['is_not', 'is not']] : [['contains', 'contains'], ['not_contains', 'does not contain']]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <div className="flex-1 min-w-[8rem]">{valueInput(c, i)}</div>
                <button type="button" aria-label="Remove condition" onClick={() => setForm({ ...form, conditions: form.conditions.filter((_, k) => k !== i) })} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Then</span>
            {form.actions.length < 5 && <button type="button" onClick={() => setForm({ ...form, actions: [...form.actions, { type: 'add_tag', value: '' }] })} className="text-xs font-semibold text-indigo-600 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add action</button>}</div>
          {form.actions.map((a, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center">
              <select aria-label="Action" className={f} value={a.type} onChange={(e) => setAct(i, { type: e.target.value, value: '' })}>{Object.entries(ACTIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <div className="flex-1 min-w-[8rem]">{actionValue(a, i)}</div>
              {form.actions.length > 1 && <button type="button" aria-label="Remove action" onClick={() => setForm({ ...form, actions: form.actions.filter((_, k) => k !== i) })} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
          <button disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60">{busy ? 'Saving…' : 'Save rule'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AutomationPage() {
  const toast = useToast();
  const [rules, setRules] = useState([]);
  const [deps, setDeps] = useState([]);
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [r, d, u] = await Promise.all([api.get('/automation-rules'), api.get('/departments'), api.get('/users', { params: { per_page: 100 } })]);
      setRules(r.data.rules);
      setDeps(d.data.departments || []);
      setAgents((u.data.data || []).filter((x) => ['agent', 'lead'].includes(x.role) && x.is_active));
    } catch (e) { toast.error(errorMessage(e)); } finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, msg) => { try { await fn(); if (msg) toast.success(msg); load(); } catch (e) { toast.error(errorMessage(e)); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-600" />Automation</h1><p className="text-sm text-slate-500">Rules that tag, prioritise, assign or follow up on tickets by themselves.</p></div>
        <button onClick={() => setForm({})} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" />New rule</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100" aria-busy={loading}>
        {loading && <div className="p-8 text-center text-sm text-slate-500">Loading…</div>}
        {!loading && rules.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No rules yet. Try “When a ticket is created and the title contains <em>down</em>: set priority urgent”.</div>}
        {rules.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">{r.name} {!r.is_active && <span className="ml-1 text-xs font-medium text-slate-500">off</span>}</div>
              <div className="text-xs text-slate-600">{describe(r, deps, agents)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Applied to {r.runs_count} {r.runs_count === 1 ? 'ticket' : 'tickets'}</div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={r.is_active} onChange={() => act(() => api.post(`/automation-rules/${r.id}/toggle`))} />On</label>
            <button onClick={() => setForm(r)} className="text-xs font-semibold text-indigo-600">Edit</button>
            <button onClick={() => window.confirm(`Delete “${r.name}”?`) && act(() => api.delete(`/automation-rules/${r.id}`), 'Rule deleted')} className="text-xs font-semibold text-rose-600">Delete</button>
          </div>
        ))}
      </div>
      {form && <RuleForm initial={form.id ? { ...form } : null} deps={deps} agents={agents} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
