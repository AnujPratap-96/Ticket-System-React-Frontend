import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, LifeBuoy, MessageSquareText, Paperclip, Search, ShieldCheck, Ticket } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelect, ThemeToggle } from '../../components/common/PreferenceControls';

const STEPS = [
  { icon: Ticket, title: 'Tell us what is wrong', text: 'Create a ticket with a few details. Add screenshots or logs so we can see what you see.' },
  { icon: Clock, title: 'We start the clock', text: 'Your ticket is routed to the right team and tracked against a response and resolution target.' },
  { icon: MessageSquareText, title: 'Get answers by email', text: 'Reply from your inbox or the portal. We keep the whole conversation in one place.' },
];

const PROMISES = [
  { icon: Clock, title: 'Service-level targets', text: 'First-response and resolution times based on your plan and ticket priority, counted in business hours.' },
  { icon: Paperclip, title: 'Share screenshots and files', text: 'Attach images, PDFs, logs and archives. Files are private to you and our support team.' },
  { icon: ShieldCheck, title: 'Your data stays yours', text: 'Download everything we hold about you, or delete your account, at any time.' },
];

export default function LandingPage() {

  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [popular, setPopular] = useState([]);
  const home = user ? (user.role === 'customer' ? '/portal' : '/staff') : null;

  useEffect(() => {
    api.get('/kb/articles', { params: { limit: 6 } }).then((r) => setPopular(r.data.articles || [])).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/help?q=${encodeURIComponent(q.trim())}` : '/help');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 font-bold shrink-0">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg"><LifeBuoy className="w-5 h-5" /></span>
            <span>DeskFlow<span className="hidden sm:inline"> Support</span></span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-4 text-sm font-medium" aria-label="Site">
            <div className="hidden sm:block"><LanguageSelect /></div>
            <ThemeToggle />
            <Link to="/help" className="hidden md:inline text-slate-600 hover:text-slate-900">Help center</Link>
            {home ? (
              <Link to={home} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold">{user.role === 'customer' ? 'My tickets' : 'Open console'}</Link>
            ) : (
              <>
                <Link to="/login" className="text-slate-700 hover:text-slate-900 px-1.5 py-1 text-xs sm:text-sm">Sign in</Link>
                <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold">Create account</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-14 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">How can we help you today?</h1>
          <p className="mt-4 text-lg text-slate-600">Search our help center for instant answers, or open a ticket and our team will take it from there.</p>
          <form onSubmit={search} className="mt-8 relative max-w-xl mx-auto" role="search">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" aria-hidden="true" />
            <input aria-label="Search the help center" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for answers…"
              className="w-full border border-slate-300 rounded-xl pl-12 pr-28 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">Search</button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={user ? '/portal/new' : '/register'} className="landing-cta bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">Create a ticket</Link>
            <Link to={user ? (home) : '/login'} className="border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-lg text-sm font-semibold">Track my ticket</Link>
          </div>
        </div>
      </section>

      {popular.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12" aria-labelledby="popular">
          <h2 id="popular" className="text-xl font-bold mb-5 flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600" />Popular articles</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popular.map((a) => (
              <li key={a.id}>
                <Link to={`/help/${a.slug}`} className="block h-full border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition">
                  <div className="font-semibold text-slate-900">{a.title}</div>
                  {a.summary && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{a.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4"><Link to="/help" className="text-sm font-semibold text-indigo-600">Browse all articles →</Link></div>
        </section>
      )}

      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-xl font-bold text-center mb-8">How support works</h2>
          <ol className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">{i + 1}</span><Icon className="w-5 h-5 text-indigo-600" aria-hidden="true" /></div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-3 gap-8">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <Icon className="w-6 h-6 text-indigo-600 mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} DeskFlow Support</span>
          <nav className="flex gap-4" aria-label="Footer"><Link to="/help" className="hover:text-slate-800">Help center</Link><Link to="/login" className="hover:text-slate-800">Sign in</Link></nav>
        </div>
      </footer>
    </div>
  );
}
