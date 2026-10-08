import { useState } from 'react';
import { Languages } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Arabic', 'Chinese', 'Japanese', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Urdu', 'Indonesian', 'Turkish', 'Russian'];

/** Translate a piece of text with the AI. Used for the reply being written and for customer messages. */
export function useTranslate(ticketId) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const translate = async (text, language) => {
    setBusy(true);
    try { return (await api.post(`/tickets/${ticketId}/ai/translate`, { text, language })).data.translation; }
    catch (err) { toast.error(errorMessage(err, 'Could not translate')); return null; } finally { setBusy(false); }
  };
  return { translate, busy };
}

/** Translate the reply being written into the customer's language. */
export default function TranslateTool({ ticketId, text, onResult }) {
  const [lang, setLang] = useState('Hindi');
  const [open, setOpen] = useState(false);
  const { translate, busy } = useTranslate(ticketId);

  const run = async () => {
    const out = await translate(text, lang);
    if (out) { onResult(out); setOpen(false); }
  };

  return (
    <span className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"><Languages className="w-3.5 h-3.5" />Translate</button>
      {open && (
        <span className="absolute z-20 left-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-3 flex flex-col gap-2">
          <label className="text-xs text-slate-600">Into
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm">{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></label>
          <button type="button" disabled={busy || !text.trim()} onClick={run} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold disabled:opacity-50">{busy ? 'Translating…' : text.trim() ? 'Translate my reply' : 'Write a reply first'}</button>
          <span className="text-[11px] text-slate-400">AI translation: check it before sending. Emails, links and numbers are not sent to the AI.</span>
        </span>
      )}
    </span>
  );
}
