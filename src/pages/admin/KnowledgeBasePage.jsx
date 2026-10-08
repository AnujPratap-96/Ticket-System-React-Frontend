import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const f = 'border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white w-full';
const blank = { title: '', summary: '', category: '', body: '', is_published: true };

export default function KnowledgeBasePage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(() => {
    api.get('/kb-manage/articles').then((r) => setRows(r.data.articles)).catch((e) => toast.error(errorMessage(e)));
  }, [toast]);
  useEffect(() => { load(); api.get('/kb-manage/analytics').then((r) => setStats(r.data)).catch(() => {}); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.patch(`/kb-manage/articles/${editing}`, form);
      else await api.post('/kb-manage/articles', form);
      toast.success('Article saved');
      setForm(blank);
      setEditing(null);
      load();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"?`)) return;
    try { await api.delete(`/kb-manage/articles/${a.id}`); toast.success(`"${a.title}" was deleted.`, 'Article deleted'); load(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-slate-900">Knowledge base</h1>
      {stats && (stats.totals.views > 0 || stats.missing_answers.length > 0) && (
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Most read</h2>
            {stats.top_viewed.map((a) => <div key={a.id} className="flex justify-between gap-2"><span className="truncate">{a.title}</span><span className="text-slate-500">{a.views}</span></div>)}</div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Needs improving</h2>
            {stats.least_helpful.length === 0 ? <p className="text-slate-500">Nobody has said an article was unhelpful.</p> : stats.least_helpful.map((a) => <div key={a.id} className="flex justify-between gap-2"><span className="truncate">{a.title}</span><span className="text-rose-600">{a.unhelpful} 👎 / {a.helpful} 👍</span></div>)}</div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Searched, nothing found (30 days)</h2>
            {stats.missing_answers.length === 0 ? <p className="text-slate-500">Every search found something.</p> : stats.missing_answers.map((m) => <div key={m.query} className="flex justify-between gap-2"><span className="truncate">“{m.query}”</span><span className="text-slate-500">{m.times}×</span></div>)}</div>
        </div>
      )}
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <label className="block text-xs font-medium text-slate-600">Title<input required maxLength={200} className={f} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className="block text-xs font-medium text-slate-600">Category<input maxLength={60} list="kb-cats" placeholder="e.g. Account, Billing" className={f} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
        <datalist id="kb-cats">{[...new Set(rows.map((r) => r.category).filter(Boolean))].map((c) => <option key={c} value={c} />)}</datalist>
        <label className="block text-xs font-medium text-slate-600">Short summary<input maxLength={500} className={f} value={form.summary || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label>
        <label className="block text-xs font-medium text-slate-600">Article (plain text; blank line = new paragraph)<textarea required rows={8} className={f} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />Published</label>
          <div className="flex gap-2">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">{editing ? 'Update' : 'Add article'}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(blank); }} className="border border-slate-300 px-4 py-2 rounded-lg text-sm">Cancel</button>}
          </div>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="text-left p-3">Title</th><th className="text-left p-3">Status</th><th className="text-left p-3">Category</th><th className="text-left p-3">Views</th><th className="text-left p-3">Helpful</th><th /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="p-3"><a href={`/help/${a.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:underline">{a.title}</a></td>
                <td className="p-3">{a.is_published ? <span className="text-emerald-700">Published</span> : <span className="text-slate-500">Draft</span>}</td>
                <td className="p-3 text-slate-600">{a.category || '—'}</td>
                <td className="p-3">{a.views}</td>
                <td className="p-3 text-slate-600">{a.helpful_count + a.unhelpful_count ? `${Math.round((a.helpful_count / (a.helpful_count + a.unhelpful_count)) * 100)}% (${a.helpful_count + a.unhelpful_count})` : '—'}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => { setEditing(a.id); setForm({ title: a.title, summary: a.summary || '', category: a.category || '', body: a.body, is_published: a.is_published }); window.scrollTo({ top: 0 }); }} className="text-indigo-600 font-semibold mr-3">Edit</button>
                  <button onClick={() => remove(a)} className="text-rose-600 font-semibold">Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No articles yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
