import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { CustomFieldsView } from '../../components/ticket/CustomFields';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useChannel } from '../../lib/realtime';
import { StatusBadge } from '../../components/common/Badges';
import Avatar from '../../components/common/Avatar';
import RatingBox from '../../components/ticket/RatingBox';
import RichEditor, { RichBody } from '../../components/common/RichEditor';
import AttachmentList from '../../components/common/AttachmentList';
import AttachmentPicker from '../../components/common/AttachmentPicker';
import { allowedTransitions, fmt } from '../../lib';

export default function PortalTicketPage() {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState({ attachments: [], uploading: false });
  const picker = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this ticket'));
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Customers can't push-notified in the page, so refresh the thread periodically.
  useChannel(`ticket.${id}`, { 'ticket.changed': load });

  useEffect(() => {
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    setSending(true);
    try {
      await api.post(`/tickets/${id}/messages`, { body, attachments: files.attachments });
      setBody('');
      picker.current?.reset();
      toast.success('Our support team has been notified and will reply soon.', 'Reply sent');
      await load();
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to send'));
    } finally {
      setSending(false);
    }
  };

  const move = async (status) => {
    if (status === 'closed') {
      if (!window.confirm('Are you sure you want to close this ticket? Once closed, you will need to open a new ticket if the issue persists.')) {
        return;
      }
    }
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      toast.success(status === 'closed' ? 'This ticket is now closed. Create a new one if the problem returns.' : 'We have reopened your ticket and the team has been notified.', status === 'closed' ? 'Ticket closed' : 'Ticket reopened');
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (error) return <div className="p-8 text-center text-rose-700">{error} <Link to="/portal" className="underline">Back to my tickets</Link></div>;
  if (!ticket) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  const moves = allowedTransitions('customer', ticket.status);
  const closed = ticket.status === 'closed' || Boolean(ticket.merged_into);

  return (
    <div className="space-y-4">
      <Link to="/portal" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" />My tickets</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-mono text-slate-500">{ticket.ticket_number} · {ticket.department?.name}</div>
          <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          {!ticket.merged_into && moves.includes('closed') && <button onClick={() => move('closed')} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-semibold">Close ticket</button>}
          {!ticket.merged_into && moves.includes('in_progress') && ticket.status === 'resolved' && <button onClick={() => move('in_progress')} className="text-xs px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 font-semibold">Reopen</button>}
        </div>
      </div>

      {ticket.merged_into && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-sm flex items-center gap-2">
          <span>This ticket was merged into</span>
          <Link className="font-semibold underline text-amber-950" to={`/portal/tickets/${ticket.merged_into.id}`}>
            {ticket.merged_into.ticket_number || 'primary ticket'}
          </Link>.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="text-xs text-slate-500 mb-1">{ticket.customer?.id === user.id ? 'You' : ticket.customer?.name} · {fmt(ticket.created_at)}</div>
        <p className="text-sm text-slate-800 whitespace-pre-wrap">{ticket.description}</p>
        <CustomFieldsView items={ticket.custom_fields} />
        <AttachmentList attachments={ticket.attachments} />
      </div>

      {(ticket.messages || []).map((m) => (
        <div key={m.id} className={`rounded-xl p-4 border ${m.sender?.role === 'customer' ? 'bg-white border-slate-200' : 'bg-indigo-50 border-indigo-100'}`}>
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-2"><Avatar user={m.sender} size={24} /><span><strong className="text-slate-700">{m.sender?.id === user.id ? 'You' : m.sender?.role === 'customer' ? m.sender.name : `${m.sender?.name} (Support)`}</strong> · {fmt(m.created_at)}</span></div>
          <RichBody html={m.body_html} text={m.body} />
          <AttachmentList attachments={m.attachments} />
        </div>
      ))}

      {['resolved', 'closed'].includes(ticket.status) && <RatingBox ticketId={ticket.id} existing={ticket.rating} onRated={load} />}

      {closed ? (
        <div className="text-sm text-slate-500 bg-slate-100 rounded-lg p-3">
          {ticket.merged_into ? 'This ticket has been merged into another ticket.' : 'This ticket is closed. Create a new ticket if you need more help.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <RichEditor ariaLabel="Reply" value={body} onChange={setBody} maxLength={20000} placeholder="Write a reply…"
            onPaste={(e) => { const f = Array.from(e.clipboardData.files); if (f.length) { e.preventDefault(); picker.current?.addFiles(f); } }} />
          <AttachmentPicker ref={picker} ticketId={Number(id)} onChange={setFiles} disabled={sending} />
          <div className="flex justify-end">
            <button disabled={sending || files.uploading || !body.trim()} onClick={send} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              <Send className="w-4 h-4" />{sending ? 'Sending…' : 'Send reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
