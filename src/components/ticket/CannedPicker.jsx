import { useEffect, useState } from 'react';
import api from '../../api/client';

/** Inserts a saved reply into the composer. {{customer_name}}, {{agent_name}}, {{agent_title}} and {{signature}} are filled in. */
export default function CannedPicker({ customerName, agentName, agentTitle, signature, onPick }) {
  const [items, setItems] = useState([]);

  useEffect(() => { api.get('/canned-responses').then((r) => setItems(r.data.canned_responses || [])).catch(() => {}); }, []);

  if (items.length === 0) return null;

  const fill = (body) => body.replaceAll('{{customer_name}}', customerName || 'there').replaceAll('{{agent_name}}', agentName || '').replaceAll('{{agent_title}}', agentTitle || '').replaceAll('{{signature}}', signature || '');

  return (
    <select aria-label="Insert canned response" value="" onChange={(e) => { const r = items.find((i) => String(i.id) === e.target.value); if (r) onPick(fill(r.body)); }}
      className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white">
      <option value="">Insert canned response…</option>
      {items.map((i) => <option key={i.id} value={i.id}>{i.title} ({i.scope})</option>)}
    </select>
  );
}
