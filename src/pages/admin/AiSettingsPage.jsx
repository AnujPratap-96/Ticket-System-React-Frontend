import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export default function AiSettingsPage() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/ai/settings').then((r) => setS(r.data)).catch((e) => toast.error(errorMessage(e)));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    setBusy(true);
    try { const r = await api.patch('/ai/settings', { enabled: !s.enabled }); setS(r.data); toast.success(r.data.enabled ? 'AI assistant turned on' : 'AI assistant turned off'); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };

  if (!s) return <div className="p-8 text-center text-slate-500">Loading…</div>;
  const pct = s.daily_limit ? Math.min(100, Math.round((s.usage_today / s.daily_limit) * 100)) : 0;

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" />AI assistant</h1>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-900">Assistant and staff AI tools</div>
            <p className="text-sm text-slate-600">Controls the customer chat bubble, “Draft reply” and “Summarize”. Turn it off to stop all AI calls immediately.</p>
          </div>
          <button role="switch" aria-checked={s.enabled} disabled={busy || !s.configured} onClick={toggle}
            className={`relative w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${s.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${s.enabled ? 'translate-x-5' : ''}`} />
            <span className="sr-only">{s.enabled ? 'On' : 'Off'}</span>
          </button>
        </div>
        {!s.configured && <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">No API key is configured on the server (<code>GROQ_API_KEY</code>), so the assistant is unavailable.</div>}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Model</span><span className="font-mono">{s.model}</span></div>
        <div>
          <div className="flex justify-between"><span className="text-slate-500">AI calls today (UTC)</span><span>{s.usage_today}{s.daily_limit ? ` / ${s.daily_limit}` : ''}</span></div>
          {s.daily_limit > 0 && <div className="h-2 bg-slate-100 rounded mt-1.5"><div className={`h-2 rounded ${pct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} /></div>}
        </div>
        <p className="text-xs text-slate-500 pt-1">When the daily limit is reached the assistant falls back to showing help articles until the next UTC day. Guests are also limited to 4 questions a minute and 25 a day per IP.</p>
      </div>
    </div>
  );
}
