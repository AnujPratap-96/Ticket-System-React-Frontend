import { useCallback, useEffect, useState } from 'react';
import { Copy, Plug, Plus } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { fmt } from '../../lib';

const TYPES = { slack: 'Slack', teams: 'Microsoft Teams', generic: 'Custom webhook' };
const f = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';

function HookForm({ initial, events, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(initial ? { name: initial.name, type: initial.type, url: '', events: initial.events, is_active: initial.is_active } : { name: '', type: 'slack', url: '', events: ['ticket.created'], is_active: true });
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState(null);

  const toggle = (e) => setForm((x) => ({ ...x, events: x.events.includes(e) ? x.events.filter((v) => v !== e) : [...x.events, e] }));

  const submit = async (ev) => {
    ev.preventDefault();
    setBusy(true);
    try {
      if (initial) { await api.patch(`/webhooks/${initial.id}`, form); toast.success('Saved.'); onSaved(); } else {
        const res = await api.post('/webhooks', form);
        if (res.data.secret) { setSecret(res.data.secret); } else { toast.success(`${form.name} was added.`, 'Integration added'); onSaved(); }
      }
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  if (secret) {
    return (
      <Modal title="Save your signing secret" onClose={onSaved}>
        <p className="text-sm text-slate-600">We sign every request with this secret (header <code>X-DeskFlow-Signature</code>). It is shown only once.</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-100 p-3 font-mono text-xs break-all">{secret}
          <button type="button" aria-label="Copy secret" onClick={() => navigator.clipboard?.writeText(secret).then(() => toast.success('Copied.'))} className="shrink-0 text-slate-500 hover:text-slate-900"><Copy className="w-4 h-4" /></button></div>
        <div className="mt-4 flex justify-end"><button onClick={onSaved} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold">I have saved it</button></div>
      </Modal>
    );
  }

  return (
    <Modal title={initial ? `Edit ${initial.name}` : 'Add integration'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Name<input required minLength={2} maxLength={80} className={`${f} mt-1`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="#support-alerts" /></label>
        {!initial && (
          <label className="block text-sm font-medium text-slate-700">Send to
            <select className={`${f} mt-1`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        )}
        <label className="block text-sm font-medium text-slate-700">{form.type === 'generic' ? 'Endpoint URL' : 'Incoming webhook URL'}{initial && <span className="text-slate-400 font-normal"> (leave blank to keep {initial.url_hint})</span>}
          <input required={!initial} type="url" className={`${f} mt-1`} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></label>
        <fieldset><legend className="text-sm font-medium text-slate-700 mb-1">Tell me when</legend>
          <div className="grid sm:grid-cols-2 gap-1.5">{Object.entries(events).map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.events.includes(k)} onChange={() => toggle(k)} />{l}</label>)}</div></fieldset>
        {initial && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />Active</label>}
        <p className="text-xs text-slate-500">Only https:// addresses on the public internet are accepted. Messages contain the ticket number, title, status, priority and a link, never the conversation.</p>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-300">Cancel</button>
          <button disabled={busy || form.events.length === 0} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}

export default function IntegrationsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [events, setEvents] = useState({});
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);

  const load = useCallback(() => {
    api.get('/webhooks').then((r) => { setRows(r.data.webhooks); setEvents(r.data.events); }).catch((e) => toast.error(errorMessage(e))).finally(() => setLoading(false));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const test = async (w) => {
    setTesting(w.id);
    try { const r = await api.post(`/webhooks/${w.id}/test`); (r.data.webhook.last_status || '').startsWith('OK') ? toast.success('The test message was delivered.', 'Test sent') : toast.error(`Result: ${r.data.webhook.last_status}`, 'Test failed'); load(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setTesting(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Plug className="w-5 h-5 text-indigo-600" />Integrations</h1><p className="text-sm text-slate-500">Post ticket events to Slack, Microsoft Teams or your own system.</p></div>
        <button onClick={() => setForm({})} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold"><Plus className="w-4 h-4" />Add integration</button>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100" aria-busy={loading}>
        {loading && <div className="p-8 text-center text-sm text-slate-500">Loading…</div>}
        {!loading && rows.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No integrations yet. Add a Slack incoming webhook to get new tickets in a channel.</div>}
        {rows.map((w) => (
          <div key={w.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900">{w.name} <span className="ml-1 text-xs font-medium text-slate-500">{TYPES[w.type]}</span> {!w.is_active && <span className="ml-1 text-xs font-medium text-rose-600">off</span>}</div>
              <div className="text-xs text-slate-500">{w.url_hint} · {w.events.map((e) => events[e] || e).join(', ')}</div>
              <div className={`text-xs mt-0.5 ${w.last_status?.startsWith('OK') ? 'text-emerald-700' : w.last_status ? 'text-rose-700' : 'text-slate-400'}`}>{w.last_status ? `${w.last_status} · ${fmt(w.last_delivery_at)}` : 'Nothing sent yet'}</div>
            </div>
            <button disabled={testing === w.id} onClick={() => test(w)} className="text-xs font-semibold text-indigo-600 disabled:opacity-50">{testing === w.id ? 'Sending…' : 'Send test'}</button>
            <button onClick={() => setForm(w)} className="text-xs font-semibold text-slate-600">Edit</button>
            <button onClick={() => window.confirm(`Delete ${w.name}?`) && api.delete(`/webhooks/${w.id}`).then(() => { toast.success('Deleted.'); load(); }).catch((e) => toast.error(errorMessage(e)))} className="text-xs font-semibold text-rose-600">Delete</button>
          </div>
        ))}
      </div>
      {form && <HookForm initial={form.id ? form : null} events={events} onClose={() => setForm(null)} onSaved={() => { setForm(null); load(); }} />}
    </div>
  );
}
