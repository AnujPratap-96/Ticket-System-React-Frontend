import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/Badges';

const STORE = 'deskflow_assistant_v1';
const MAX_KEPT = 30;

// The conversation is kept per browser tab, and tagged with whose it is so another person never inherits it.
const read = () => { try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch { return {}; } };
const load = () => read().messages || [];
const save = (messages, owner) => { try { sessionStorage.setItem(STORE, JSON.stringify({ owner, messages: messages.slice(-MAX_KEPT) })); } catch { /* storage unavailable */ } };

/**
 * Floating support assistant (bottom-right). Guests: help-center questions only.
 * Signed-in customers: also their own tickets. Answers are shown as plain text, never HTML.
 */
export default function AssistantWidget() {
  const { user, booting } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.role === 'customer';
  const isStaff = !!user && !isCustomer;
  const ticketBase = isStaff ? '/staff/tickets' : '/portal/tickets';
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(load);
  const endRef = useRef(null);
  const owner = useRef(read().owner ?? null);
  const inputRef = useRef(null);

  useEffect(() => { save(messages, owner.current); }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  // A different person must never inherit the previous conversation (but a page reload keeps your own).
  useEffect(() => {
    if (booting) return;
    const now = user ? String(user.id) : 'guest';
    if (owner.current !== now) {
      owner.current = now;
      setMessages([]);
      save([], now);
    }
  }, [booting, user]);

  const quick = isStaff
    ? [
      { admin: 'Open tickets overall in the app', lead: 'Ticket overview for my department', agent: 'Overview of my tickets' }[user.role],
      user.role === 'agent' ? 'Show my open tickets' : 'Show my assigned tickets',
      'How do I merge tickets?',
    ]
    : isCustomer
      ? ['Show my open tickets', 'What are your support hours?', 'What files can I attach?']
      : ['How does support work?', 'What are your support hours?', 'What files can I attach?'];

  const send = async (raw) => {
    const message = (raw ?? text).trim();
    if (!message || sending) return;
    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.text })).filter((m) => m.content);
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setText('');
    setSending(true);
    try {
      const res = await api.post('/assistant/chat', { message, history });
      const d = res.data;
      setMessages((m) => [...m, { role: 'assistant', text: d.message, kind: d.kind, articles: d.articles, tickets: d.tickets, actions: d.actions, lastQuestion: message }]);
    } catch (err) {
      const limited = err.response?.status === 429;
      setMessages((m) => [...m, {
        role: 'assistant', kind: 'error',
        text: limited
          ? (user ? 'You are sending messages too quickly. Please wait a moment.' : 'You have reached the guest limit for now. Sign in for more questions, or browse the help center.')
          : 'Sorry, something went wrong. Please try again, or browse the help center.',
        actions: limited && !user ? [{ type: 'sign_in', label: 'Sign in' }, { type: 'register', label: 'Create account' }] : [],
      }]);
    } finally {
      setSending(false);
    }
  };

  const runAction = (a, m) => {
    setOpen(false);
    if (a.type === 'sign_in') navigate('/login');
    else if (a.type === 'register') navigate('/register');
    else if (a.type === 'create_ticket') {
      const title = a.prefill?.title || m?.lastQuestion || '';
      navigate(`/portal/new${title ? `?title=${encodeURIComponent(title)}` : ''}`);
    }
  };

  const clear = () => { setMessages([]); };

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close support assistant' : 'Open support assistant'} aria-expanded={open}
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white p-3 sm:pl-4 sm:pr-5 sm:py-3 rounded-full shadow-lg shadow-indigo-500/30 transition-all">
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        <span className="text-sm font-semibold hidden sm:inline">{open ? 'Close' : 'Ask us'}</span>
      </button>

      {open && (
        <section role="dialog" aria-label="Support assistant" className="fixed bottom-16 sm:bottom-20 inset-x-2 sm:inset-x-auto sm:right-5 z-50 sm:w-[400px] h-[calc(100dvh-5.5rem)] sm:h-[min(540px,calc(100vh-6.5rem))] max-h-[calc(100dvh-5.5rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <header className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="bg-white/20 p-1.5 rounded-lg"><Bot className="w-5 h-5" /></span>
              <div><div className="font-semibold text-sm leading-tight">Support Assistant</div><div className="text-[11px] text-indigo-100">{isStaff ? 'Console help + your assigned tickets' : user ? 'Help center + your tickets' : 'Ask about how support works'}</div></div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && <button onClick={clear} className="text-[11px] px-2 py-1 rounded hover:bg-white/15">Clear</button>}
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1 rounded hover:bg-white/15"><X className="w-4 h-4" /></button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3">
                Hi! I can answer questions about {isStaff ? 'the support console and platform' : 'how our support works'}{isCustomer ? ' and show your tickets' : isStaff ? ' and show the tickets assigned to you' : ''}. Try one of these:
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {quick.map((q) => <button key={q} onClick={() => send(q)} className="text-xs px-2.5 py-1.5 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50">{q}</button>)}
                </div>
                {!user && <p className="mt-3 text-xs text-slate-500">Guests can ask general questions. <Link to="/login" onClick={() => setOpen(false)} className="text-indigo-600 font-semibold">Sign in</Link> to see your tickets.</p>}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>

                  {m.articles?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">Read more</div>
                      {m.articles.map((a) => (
                        <Link key={a.slug} to={`/help/${a.slug}`} onClick={() => setOpen(false)} className="block border border-slate-200 rounded-lg px-2.5 py-1.5 hover:border-indigo-300 hover:bg-indigo-50/40">
                          <div className="text-xs font-semibold text-indigo-700">{a.title}</div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {m.tickets?.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.tickets.map((t) => (
                        <Link key={t.id} to={`${ticketBase}/${t.id}`} onClick={() => setOpen(false)} className="block border border-slate-200 rounded-lg px-2.5 py-2 hover:border-indigo-300">
                          <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-mono text-slate-500">{t.ticket_number}</span><StatusBadge status={t.status} /></div>
                          <div className="text-xs font-medium text-slate-800 truncate mt-0.5">{t.title}</div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {m.actions?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.actions.map((a) => (
                        <button key={a.type + a.label} onClick={() => runAction(a, m)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">{a.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start"><div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1" aria-label="Assistant is typing">
                {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div></div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-slate-200 bg-white p-2.5">
            <div className="flex items-center gap-2">
              <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={user ? 600 : 300} placeholder="Type your question…" aria-label="Your question"
                className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button disabled={sending || !text.trim()} aria-label="Send" className="bg-indigo-600 disabled:opacity-40 text-white p-2.5 rounded-full"><Send className="w-4 h-4" /></button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 text-center">AI can make mistakes. Please don't share passwords or payment details.</p>
          </form>
        </section>
      )}
    </>
  );
}

export { MessageCircle };
