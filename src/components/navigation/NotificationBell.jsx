import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useChannel } from '../../lib/realtime';
import { fmt } from '../../lib';

const POLL_MS = 30000;

export default function NotificationBell({ basePath = '', dark = false }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setItems(res.data.notifications || []);
      setUnread(res.data.unread_count || 0);
    } catch {
      // bell is best-effort; next poll retries
    }
  }, []);

  const { user } = useAuth();
  // Instant refresh when the server pings us; the 30 s poll below stays as the safety net.
  useChannel(user ? `user.${user.id}` : null, { notification: load });

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  const openItem = async (n) => {
    setOpen(false);
    if (!n.read) {
      api.post(`/notifications/${n.id}/read`).then(load).catch(() => {});
    }
    navigate(`${basePath}/tickets/${n.ticket_id}`);
  };

  const readAll = async () => {
    await api.post('/notifications/read-all').then(() => toast.success('You are all caught up.', 'Notifications cleared')).catch(() => {});
    load();
  };

  return (
    <div className="relative" ref={box}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open}
        className={`relative p-1.5 rounded ${dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
        <Bell className="w-4 h-4" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && <button onClick={readAll} className="text-xs text-indigo-600 font-semibold">Mark all read</button>}
          </div>
          <ul className="max-h-96 overflow-auto divide-y divide-slate-100">
            {items.length === 0 && <li className="p-6 text-center text-sm text-slate-500">Nothing yet.</li>}
            {items.map((n) => (
              <li key={n.id}>
                <button onClick={() => openItem(n)} className={`w-full text-left px-4 py-3 hover:bg-slate-50 ${n.read ? '' : 'bg-indigo-50/50'}`}>
                  <div className="text-sm font-medium text-slate-900">{n.title}</div>
                  <div className="text-xs text-slate-600 truncate">{n.body}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{fmt(n.created_at)}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
