import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Frown, Sparkles } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { label } from '../../lib';

/** Staff-only: customer mood flags, the AI's triage suggestion (accept / dismiss) and tickets that look like duplicates. */
export default function InsightsPanel({ ticket, onChanged, onMerge }) {
  const toast = useToast();
  const [similar, setSimilar] = useState([]);
  const [busy, setBusy] = useState(false);
  const ai = ticket.ai || {};
  const triage = ai.triage;

  useEffect(() => {
    if (ticket.merged_into) return;
    api.get(`/tickets/${ticket.id}/similar`).then((r) => setSimilar(r.data.similar)).catch(() => setSimilar([]));
  }, [ticket.id, ticket.merged_into]);

  const decide = async (accept) => {
    setBusy(true);
    try {
      await api.post(`/tickets/${ticket.id}/ai/triage/${accept ? 'accept' : 'dismiss'}`);
      toast.success(accept ? 'The suggestion was applied.' : 'The suggestion was dismissed.', accept ? 'Triage applied' : 'Dismissed');
      onChanged();
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  if (!ai.urgent && ai.sentiment !== 'negative' && !triage && similar.length === 0) return null;

  return (
    <div className="space-y-2">
      {(ai.urgent || ai.sentiment === 'negative') && (
        <div className="flex flex-wrap gap-2">
          {ai.urgent && <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 text-xs font-semibold"><AlertTriangle className="w-3.5 h-3.5" />Looks urgent</span>}
          {ai.sentiment === 'negative' && <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-semibold"><Frown className="w-3.5 h-3.5" />Customer sounds upset</span>}
        </div>
      )}

      {triage && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-sm">
          <div className="flex items-center gap-2 font-semibold text-violet-900"><Sparkles className="w-4 h-4" />Suggested triage</div>
          <ul className="mt-1 text-slate-700 space-y-0.5">
            {triage.priority && triage.priority !== ticket.priority && <li>Priority: <strong>{label(triage.priority)}</strong> (now {label(ticket.priority)})</li>}
            {triage.tags?.length > 0 && <li>Tags: {triage.tags.map((t) => <span key={t} className="mr-1 rounded bg-white border border-violet-200 px-1.5 py-0.5 text-xs">{t}</span>)}</li>}
            {triage.department && triage.department_id !== ticket.department?.id && <li>Might belong to <strong>{triage.department}</strong> (not applied automatically)</li>}
            {triage.reason && <li className="text-slate-500">{triage.reason}</li>}
          </ul>
          <div className="mt-2 flex gap-2">
            <button disabled={busy} onClick={() => decide(true)} className="px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-semibold disabled:opacity-60">Apply</button>
            <button disabled={busy} onClick={() => decide(false)} className="px-3 py-1 rounded-lg border border-violet-300 text-violet-700 text-xs font-semibold disabled:opacity-60">Dismiss</button>
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-sm">
          <div className="font-semibold text-sky-900">Possible duplicates</div>
          <ul className="mt-1 space-y-0.5">
            {similar.map((s) => <li key={s.id}><Link to={`/staff/tickets/${s.id}`} className="text-sky-800 font-medium hover:underline">{s.ticket_number}</Link> <span className="text-slate-600">{s.title}</span> <span className="text-xs text-slate-400">{Math.round(s.score * 100)}% alike · {label(s.status)}</span></li>)}
          </ul>
          <button onClick={onMerge} className="mt-2 text-xs font-semibold text-sky-700 hover:underline">Merge this ticket into another…</button>
        </div>
      )}
    </div>
  );
}
