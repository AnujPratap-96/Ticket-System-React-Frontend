import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import api from '../../api/client';

/** Shows matching help articles while the customer is still typing their ticket subject. */
export default function ArticleSuggestions({ query }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if ((query || '').trim().length < 4) { setItems([]); return undefined; }
    const t = setTimeout(() => {
      api.get('/kb/articles', { params: { q: query.trim(), limit: 4 } }).then((r) => setItems(r.data.articles)).catch(() => setItems([]));
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  if (items.length === 0) return null;
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm" aria-live="polite">
      <div className="flex items-center gap-2 font-semibold text-amber-900 mb-1"><Lightbulb className="w-4 h-4" />These articles might already answer your question</div>
      <ul className="space-y-1">{items.map((a) => <li key={a.id}><a href={`/help/${a.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-700 underline">{a.title}</a></li>)}</ul>
    </div>
  );
}
