import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { LifeBuoy, Search } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useT } from '../../context/PreferencesContext';
import { LanguageSelect, ThemeToggle } from '../../components/common/PreferenceControls';

function Shell({ children }) {
  const { user } = useAuth();
  const home = !user ? '/login' : user.role === 'customer' ? '/portal' : '/staff';
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to={user ? home : '/'} className="flex items-center gap-2 font-bold text-slate-900"><LifeBuoy className="w-5 h-5 text-indigo-600" />Help Center</Link>
          <div className="flex items-center gap-2"><LanguageSelect /><ThemeToggle /><Link to={home} className="text-sm text-indigo-600 font-semibold">{user ? 'Back to my tickets' : 'Sign in'}</Link></div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

/** Article bodies are plain text: render paragraphs, never raw HTML. */
export function ArticleBody({ text }) {
  return text.split(/\n{2,}/).map((p, i) => <p key={i} className="mb-3 whitespace-pre-wrap text-slate-800">{p}</p>);
}

export function HelpCenterPage() {
  const { user } = useAuth();
  const t = useT();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [articles, setArticles] = useState([]);
  const [cats, setCats] = useState([]);
  const [cat, setCat] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.get('/kb/categories').then((r) => setCats(r.data.categories)).catch(() => {}); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/kb/articles', { params: { q, limit: 20, ...(cat && { category: cat }) } })
        .then((r) => { setArticles(r.data.articles); setError(''); })
        .catch((e) => setError(errorMessage(e, 'Could not load articles')));
    }, 250);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">{t('help.title')}</h1>
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input aria-label="Search the help center" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('help.search')} className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-sm bg-white" />
      </div>
      {cats.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Categories">
          {[{ name: '', articles: null }, ...cats].map((c) => (
            <button key={c.name} role="tab" aria-selected={cat === c.name} onClick={() => setCat(c.name)} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${cat === c.name ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>{c.name || t('help.all')}{c.articles != null && <span className="ml-1 opacity-70">{c.articles}</span>}</button>
          ))}
        </div>
      )}
      {error && <div role="alert" className="text-rose-700 text-sm mb-3">{error}</div>}
      <ul className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {articles.length === 0 && (
          <li className="p-8 text-center text-sm text-slate-500">
            {q.trim() ? <>No articles match “{q}”. Try fewer words, or <Link to={user ? '/portal/new' : '/register'} className="text-indigo-600 font-semibold">create a ticket</Link>.</>
              : <>There are no help articles yet. {user && user.role !== 'customer' ? <Link to="/staff/kb" className="text-indigo-600 font-semibold">Add the first one</Link> : 'Please check back soon.'}</>}
          </li>
        )}
        {articles.map((a) => (
          <li key={a.id}><Link to={`/help/${a.slug}`} className="block p-4 hover:bg-slate-50"><div className="font-semibold text-slate-900">{a.title}</div>{a.summary && <div className="text-sm text-slate-600 mt-0.5">{a.summary}</div>}</Link></li>
        ))}
      </ul>
    </Shell>
  );
}

export function ArticlePage() {
  const t = useT();
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(null);

  const vote = async (helpful) => {
    try { await api.post(`/kb/articles/${slug}/vote`, { helpful }); setVoted(helpful); } catch (e) { setError(errorMessage(e)); }
  };

  useEffect(() => {
    api.get(`/kb/articles/${slug}`).then((r) => setArticle(r.data.article)).catch((e) => setError(e.response?.status === 404 ? 'This article does not exist.' : errorMessage(e)));
  }, [slug]);

  return (
    <Shell>
      <Link to="/help" className="text-sm text-indigo-600 font-semibold">← All articles</Link>
      {error && <div className="mt-6 text-slate-600">{error}</div>}
      {article && (
        <article className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
          {article.category && <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">{article.category}</div>}
          <h1 className="text-2xl font-bold text-slate-900 mb-4">{article.title}</h1>
          <ArticleBody text={article.body} />
          <div className="mt-6 pt-4 border-t border-slate-100 text-sm text-slate-600 flex flex-wrap items-center gap-3">
            {voted === null ? (
              <><span>{t('help.helpful')}</span>
                <button onClick={() => vote(true)} className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-emerald-50">👍 {t('help.yes')}</button>
                <button onClick={() => vote(false)} className="px-3 py-1 rounded-lg border border-slate-300 hover:bg-rose-50">👎 {t('help.no')}</button></>
            ) : <span role="status">Thanks for your feedback{voted ? '!' : '. Create a ticket and we will help you directly.'}</span>}
          </div>
          <div className="mt-3 text-sm text-slate-600">Still stuck? <Link to="/portal/new" className="text-indigo-600 font-semibold">Create a ticket</Link></div>
        </article>
      )}
    </Shell>
  );
}
