import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, GitMerge, Lock, Send, Sparkles } from 'lucide-react';
import { CustomFieldsView } from '../../components/ticket/CustomFields';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useTicketPresence from '../../hooks/useTicketPresence';
import CollisionBanner from '../../components/ticket/CollisionBanner';
import SlaBadge from '../../components/sla/SlaBadge';
import { PriorityBadge, StatusBadge } from '../../components/common/Badges';
import MentionPicker from '../../components/ticket/MentionPicker';
import MergeModal from '../../components/ticket/MergeModal';
import { useChannel } from '../../lib/realtime';
import RichEditor, { RichBody } from '../../components/common/RichEditor';
import { loadSignaturePref, saveSignaturePref, signatureOf, withSignature } from '../../lib/signature';
import InsightsPanel from '../../components/ticket/InsightsPanel';
import TranslateTool, { useTranslate } from '../../components/ticket/TranslateTool';
import Avatar from '../../components/common/Avatar';
import CannedPicker from '../../components/ticket/CannedPicker';
import TagEditor from '../../components/ticket/TagEditor';
import AttachmentList from '../../components/common/AttachmentList';
import AttachmentPicker from '../../components/common/AttachmentPicker';
import { PRIORITIES, allowedTransitions, fmt, label } from '../../lib';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, isStaff, permissions } = useAuth();
  const toast = useToast();
  const [ticket, setTicket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [files, setFiles] = useState({ attachments: [], uploading: false });
  const picker = useRef(null);
  const navigate = useNavigate();
  const [mentions, setMentions] = useState([]);
  const [showMerge, setShowMerge] = useState(false);
  const [aiBusy, setAiBusy] = useState(''); // '' | 'draft' | 'summary'
  const [summary, setSummary] = useState(null);
  const [translated, setTranslated] = useState({});
  const [sigOn, setSigOn] = useState(loadSignaturePref);
  const tr = useTranslate(id);

  const { collisions, setCollisions } = useTicketPresence(id, isStaff, body.trim().length > 0);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.ticket);
      setCollisions(res.data.active_collisions || []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Error loading ticket'));
    }
  }, [id, setCollisions]);

  useEffect(() => { setTicket(null); load(); }, [load]);
  useChannel(`ticket.${id}`, { 'ticket.changed': load });
  useChannel(`ticket.${id}.staff`, { 'ticket.changed': load }, isStaff);

  const canPickAgents = user.role === 'lead' || user.role === 'admin';
  const deptId = ticket?.department?.id;
  useEffect(() => {
    if (!canPickAgents || !deptId) return;
    api.get(`/departments/${deptId}/agents`)
      .then((res) => setAgents(res.data.agents || []))
      .catch(() => setAgents([]));
  }, [canPickAgents, deptId]);

  const act = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const changeStatus = (status) => act(() => api.patch(`/tickets/${id}/status`, { status }), `Status set to ${label(status)}`);
  // AI helpers: always a suggestion for the agent to edit, never sent automatically.
  const aiDraft = async () => {
    if (body.trim() && !window.confirm('Replace what you have typed with an AI draft?')) return;
    setAiBusy('draft');
    try { const r = await api.post(`/tickets/${id}/ai/draft-reply`); setBody(r.data.draft); setInternal(false); toast.info('Draft ready. Review and edit before sending.'); }
    catch (err) { toast.error(errorMessage(err, 'Could not generate a draft')); } finally { setAiBusy(''); }
  };
  const aiSummary = async () => {
    setAiBusy('summary');
    try { const r = await api.post(`/tickets/${id}/ai/summary`); setSummary(r.data.summary); toast.success('The summary is shown in the sidebar.', 'Summary ready'); }
    catch (err) { toast.error(errorMessage(err, 'Could not summarize')); } finally { setAiBusy(''); }
  };

  const toggleWatch = () => act(() => (ticket.is_watching ? api.delete(`/tickets/${id}/watch`) : api.post(`/tickets/${id}/watch`)), ticket.is_watching ? 'You stopped watching this ticket' : 'You are now watching this ticket');
  const changePriority = (priority) => act(() => api.patch(`/tickets/${id}/priority`, { priority }), 'Priority updated');
  const assign = (agentId) => act(() => api.patch(`/tickets/${id}/assign`, { agent_id: agentId || null }), 'Assignment updated');

  const send = async (force = false) => {
    if (!body.trim()) return;
    const wasNote = internal;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/messages`, { body: internal ? body : withSignature(body, user, isStaff && sigOn), is_internal_note: internal, force_send: force, attachments: files.attachments, mentions: mentions.filter((m) => body.includes(`@${m.name}`)).map((m) => m.id) });
      setBody('');
      setMentions([]);
      picker.current?.reset();
      setInternal(false);
      toast.success(wasNote ? 'Your internal note was added. Customers cannot see it.' : 'Your reply was sent to the customer.', wasNote ? 'Note saved' : 'Reply sent');
      await load();
    } catch (err) {
      if (err.response?.status === 409 && err.response.data?.code === 'agent_collision') {
        if (window.confirm(`${err.response.data.other_agent} is replying to this ticket. Send anyway?`)) {
          setSending(false);
          return send(true);
        }
      } else {
        toast.error(errorMessage(err, 'Failed to send'));
      }
    }
    setSending(false);
  };

  if (error) return <div className="p-8 text-center text-rose-700">{error} <Link to="/staff" className="underline">Back to tickets</Link></div>;
  if (!ticket) return <div className="p-8 text-center text-slate-500">Loading…</div>;

  const transitions = allowedTransitions(user.role, ticket.status);
  const field = 'border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white w-full';
  const closedForUser = ticket.status === 'closed' && user.role !== 'admin';

  return (
    <div>
      <Link to="/staff" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-3"><ArrowLeft className="w-4 h-4" />Back to tickets</Link>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900"><span className="font-mono text-slate-500 text-base mr-2">{ticket.ticket_number}</span>{ticket.title}</h1>
        <PriorityBadge priority={ticket.priority} /><StatusBadge status={ticket.status} />
      </div>

      {ticket.merged_into && (
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 mb-4 text-sm">This ticket was merged into <Link className="text-indigo-600 font-semibold underline" to={`/staff/tickets/${ticket.merged_into.id}`}>{ticket.merged_into.ticket_number}</Link>.</div>
      )}

      <CollisionBanner collisions={collisions} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4" aria-label="Conversation">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-2"><Avatar user={ticket.customer} size={24} />{ticket.customer?.name} · {fmt(ticket.created_at)}</div>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{ticket.description}</p>
            <CustomFieldsView items={ticket.custom_fields} />
            <AttachmentList attachments={ticket.attachments} />
          </div>

          {(ticket.messages || []).map((m) => (
            <div key={m.id} className={`rounded-xl p-4 border shadow-sm ${m.is_internal_note ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
              <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                {m.is_internal_note && <Lock className="w-3 h-3 text-amber-600" />}
                <Avatar user={m.sender} size={24} />
                <strong className="text-slate-700">{m.sender?.name}</strong>
                {m.is_internal_note && <span className="text-amber-700 font-semibold">Internal note (staff only)</span>}
                <span>· {fmt(m.created_at)}</span>
              </div>
              <RichBody html={m.body_html} text={m.body} />
              {translated[m.id] && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap border-l-2 border-violet-300 pl-3">{translated[m.id]}</p>}
              {isStaff && !m.is_internal_note && m.sender?.role === 'customer' && !translated[m.id] && (
                <button type="button" disabled={tr.busy} onClick={async () => { const out = await tr.translate(m.body, 'English'); if (out) setTranslated((t) => ({ ...t, [m.id]: out })); }} className="mt-2 text-xs font-semibold text-violet-700 disabled:opacity-50">Translate to English</button>
              )}
              <AttachmentList attachments={m.attachments} />
            </div>
          ))}

          {closedForUser ? (
            <div className="text-sm text-slate-500 bg-slate-100 rounded-lg p-3">This ticket is closed and can no longer be replied to.</div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              {isStaff && (
                <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Reply type">
                  <button role="tab" aria-selected={!internal} onClick={() => setInternal(false)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${!internal ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-300 text-slate-600'}`}>Public reply</button>
                  <button role="tab" aria-selected={internal} onClick={() => setInternal(true)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${internal ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-300 text-slate-600'}`}>Internal note</button>
                  <button type="button" onClick={aiDraft} disabled={!!aiBusy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50"><Sparkles className="w-3.5 h-3.5" />{aiBusy === 'draft' ? 'Drafting…' : 'Draft reply'}</button>
                  <TranslateTool ticketId={ticket.id} text={body} onResult={(t) => setBody(t)} />
                  <MentionPicker ticketId={ticket.id} onMention={(u) => { setMentions((m) => [...m, u]); setBody((b) => `${b}${b && !b.endsWith(' ') ? ' ' : ''}@${u.name} `); }} />
                  <span className="sm:ml-auto"><CannedPicker customerName={ticket.customer?.name} agentName={user.name} agentTitle={user.job_title} signature={signatureOf(user)} onPick={(text) => setBody((b) => (b ? `${b}\n${text}` : text))} /></span>
                </div>
              )}
              <RichEditor value={body} onChange={setBody} ariaLabel="Message" tone={internal ? 'note' : 'default'} maxLength={20000}
                previewExtra={isStaff && !internal && sigOn ? signatureOf(user) : ''}
                onPaste={(e) => { const f = Array.from(e.clipboardData.files); if (f.length) { e.preventDefault(); picker.current?.addFiles(f); } }}
                placeholder={internal ? 'Staff-only note…' : 'Type your reply…'} />
              {isStaff && !internal && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" checked={sigOn} onChange={(e) => { setSigOn(e.target.checked); saveSignaturePref(e.target.checked); }} />
                  Add my signature <span className="text-slate-400">({user.name}{user.job_title ? `, ${user.job_title}` : ''})</span>
                  {!user.job_title && <Link to="/staff/account" className="text-indigo-600 font-semibold hover:underline">Add your job title</Link>}
                </label>
              )}
              <AttachmentPicker ref={picker} ticketId={Number(id)} onChange={setFiles} disabled={sending} />
              <div className="flex justify-end">
                <button disabled={sending || files.uploading || !body.trim()} onClick={() => send(false)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold w-full sm:w-auto">
                  <Send className="w-4 h-4" />{sending ? 'Sending…' : internal ? 'Add note' : 'Send reply'}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4" aria-label="Ticket details">
          {isStaff && <InsightsPanel ticket={ticket} onChanged={load} onMerge={() => setShowMerge(true)} />}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ticket metrics</h2>
            <label className="block text-xs font-medium text-slate-600">Status
              <select className={`${field} mt-1`} value={ticket.status} onChange={(e) => changeStatus(e.target.value)} disabled={transitions.length === 0}>
                <option value={ticket.status}>{label(ticket.status)}</option>
                {transitions.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </label>
            {isStaff && (
              <label className="block text-xs font-medium text-slate-600">Priority
                <select className={`${field} mt-1`} value={ticket.priority} onChange={(e) => changePriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{label(p)}</option>)}
                </select>
              </label>
            )}
            {isStaff && (
              <div className="text-xs font-medium text-slate-600">Assigned agent
                {canPickAgents ? (
                  <select className={`${field} mt-1`} value={ticket.assigned_agent?.id || ''} onChange={(e) => assign(e.target.value)}>
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.active_tickets_count ?? 0}/{a.max_active_tickets})</option>)}
                  </select>
                ) : (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-800">{ticket.assigned_agent?.name || 'Unassigned'}</span>
                    {ticket.assigned_agent?.id !== user.id && (
                      <button onClick={() => assign(user.id)} className="text-xs px-2.5 py-1 rounded-lg border border-indigo-300 text-indigo-700 font-semibold">Assign to me</button>
                    )}
                  </div>
                )}
              </div>
            )}
            {!isStaff && <div className="text-sm text-slate-700">Agent: {ticket.assigned_agent?.name || 'Awaiting assignment'}</div>}
            <div className="text-sm text-slate-700">Department: {ticket.department?.name}</div>
            <div className="text-sm text-slate-700">Org: {ticket.organization?.name} {ticket.organization?.sla_tier && `(${label(ticket.organization.sla_tier)})`}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">SLA clocks</h2>
            {(ticket.sla_deadlines || []).map((d) => (
              <div key={d.id} className="space-y-0.5">
                <SlaBadge deadline={d} />
                <div className="text-[11px] text-slate-500 pl-1">Target: {fmt(d.target_deadline)}</div>
              </div>
            ))}
          </div>

          {isStaff && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-violet-500" />AI summary</h2>
                <button onClick={aiSummary} disabled={!!aiBusy} className="text-xs font-semibold text-violet-700 disabled:opacity-50">{aiBusy === 'summary' ? 'Summarizing…' : summary ? 'Refresh' : 'Summarize'}</button>
              </div>
              {summary && <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{summary}</p>}
              {summary && <p className="mt-2 text-[11px] text-slate-400">AI-generated. Includes internal notes. Verify before acting.</p>}
            </div>
          )}

          {isStaff && (
            <div className="flex gap-2">
              <button onClick={toggleWatch} className="flex-1 flex items-center justify-center gap-2 border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-semibold">
                {ticket.is_watching ? <><EyeOff className="w-4 h-4" />Unwatch</> : <><Eye className="w-4 h-4" />Watch</>}
              </button>
              {(user.role === 'lead' || user.role === 'admin') && ticket.status !== 'closed' && (
                <button onClick={() => setShowMerge(true)} className="flex-1 flex items-center justify-center gap-2 border border-slate-300 bg-white rounded-lg px-3 py-2 text-sm font-semibold"><GitMerge className="w-4 h-4" />Merge</button>
              )}
            </div>
          )}

          {isStaff && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tags</h2>
              <TagEditor ticketId={ticket.id} initial={ticket.tags} />
            </div>
          )}

          {ticket.rating && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Customer rating</h2>
              <div className="text-amber-500">{'★'.repeat(ticket.rating.rating)}<span className="text-slate-300">{'★'.repeat(5 - ticket.rating.rating)}</span></div>
              {ticket.rating.comment && <p className="text-slate-600 mt-1">“{ticket.rating.comment}”</p>}
            </div>
          )}

          {permissions.view_audit_history && ticket.audits && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Audit log</h2>
              <ul className="space-y-2 max-h-72 overflow-auto">
                {ticket.audits.map((a) => (
                  <li key={a.id} className="text-xs text-slate-700">
                    <span className="font-semibold">{a.event_type.replace(/_/g, ' ')}</span>
                    {a.field_name && <> · {a.field_name}: {a.old_value ?? '—'} → {a.new_value ?? '—'}</>}
                    <div className="text-slate-400">{a.actor?.name || 'system'} · {fmt(a.created_at)}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      {showMerge && <MergeModal ticket={ticket} onClose={() => setShowMerge(false)} onMerged={(targetId) => { setShowMerge(false); navigate(`/staff/tickets/${targetId}`); }} />}
    </div>
  );
}
