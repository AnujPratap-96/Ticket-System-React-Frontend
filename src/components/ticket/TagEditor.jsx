import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

/** Staff-only triage labels on a ticket. Saves on every add/remove. */
export default function TagEditor({ ticketId, initial }) {
  const toast = useToast();
  const [tags, setTags] = useState(initial || []);
  const [draft, setDraft] = useState('');
  const [known, setKnown] = useState([]);

  useEffect(() => { setTags(initial || []); }, [initial]);
  useEffect(() => { api.get('/tags').then((r) => setKnown(r.data.tags || [])).catch(() => {}); }, []);

  const save = async (next) => {
    const prev = tags;
    setTags(next);
    try {
      const res = await api.put(`/tickets/${ticketId}/tags`, { tags: next });
      setTags(res.data.tags);
      toast.success('Tags saved.', 'Tags updated');
    } catch (err) {
      setTags(prev);
      toast.error(errorMessage(err));
    }
  };

  const add = (e) => {
    e.preventDefault();
    const t = draft.trim().toLowerCase().replace(/\s+/g, '-');
    setDraft('');
    if (t && !tags.includes(t)) save([...tags, t]);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs rounded-full pl-2.5 pr-1 py-0.5">
            {t}
            <button type="button" onClick={() => save(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="p-0.5 hover:bg-slate-200 rounded-full"><X className="w-3 h-3" /></button>
          </span>
        ))}
      </div>
      <form onSubmit={add} className="mt-2">
        <input list="known-tags" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={30} placeholder="Add tag + Enter" aria-label="Add tag"
          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm" />
        <datalist id="known-tags">{known.filter((k) => !tags.includes(k)).map((k) => <option key={k} value={k} />)}</datalist>
      </form>
    </div>
  );
}
