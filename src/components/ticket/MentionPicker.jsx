import { useEffect, useState } from 'react';
import api from '../../api/client';

/** Adds "@Name" to the message and remembers who was mentioned (ids are sent with the reply). */
export default function MentionPicker({ ticketId, onMention }) {
  const [users, setUsers] = useState([]);

  useEffect(() => { api.get(`/tickets/${ticketId}/mentionable`).then((r) => setUsers(r.data.users || [])).catch(() => {}); }, [ticketId]);

  if (users.length === 0) return null;
  return (
    <select aria-label="Mention a teammate" value="" onChange={(e) => { const u = users.find((x) => String(x.id) === e.target.value); if (u) onMention(u); }}
      className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white">
      <option value="">@ Mention teammate…</option>
      {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
    </select>
  );
}
