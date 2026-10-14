import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LifeBuoy } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { getTenant, setTenant, usesSubdomains, workspaceUrl } from '../../lib/tenant';
import { LanguageSelect, ThemeToggle } from '../../components/common/PreferenceControls';

const field = 'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';

/** "Which company's support are you looking for?" Shown whenever the address does not say. */
export default function WorkspacePage() {
  const navigate = useNavigate();
  const [slug, setSlug] = useState(getTenant() || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    try {
      await api.get(`/workspaces/${clean}`);
      setTenant(clean);
      if (usesSubdomains()) window.location.assign(workspaceUrl(clean)); else navigate('/login');
    } catch (err) {
      setError(err.response?.status === 404 ? 'We could not find a workspace with that address. Check the spelling, or ask your administrator for the link.' : errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-3 right-3 flex items-center gap-2"><LanguageSelect /><ThemeToggle /></div>
      <form onSubmit={go} className="bg-white w-full max-w-md p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LifeBuoy className="w-5 h-5" /></div>
          <div><h1 className="font-bold text-slate-900">Find your workspace</h1><p className="text-xs text-slate-500">Every company has its own support space</p></div>
        </div>
        {error && <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
        <label className="block text-sm font-medium text-slate-700">Workspace address
          <div className="mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <input autoFocus required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="your-company" aria-label="Workspace address" className={field} />
          </div>
          <span className="block text-xs text-slate-500 mt-1">It is the first part of your company's support address, for example <strong>acme</strong> in acme.yourdomain.com. Your administrator or a support email has it.</span>
        </label>
        <button disabled={busy || !slug.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">{busy ? 'Looking…' : 'Continue'}</button>
        <p className="text-sm text-slate-600 text-center">Starting a support desk for your own company? <Link to="/start" className="text-indigo-600 font-semibold">Create a workspace</Link></p>
      </form>
    </div>
  );
}
