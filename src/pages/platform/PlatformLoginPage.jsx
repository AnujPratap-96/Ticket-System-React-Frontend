import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import PasswordInput from '../../components/common/PasswordInput';

const field = 'mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';

/** Sign-in for the platform owner (the person who runs DeskFlow itself, not one company's support). */
export default function PlatformLoginPage() {
  const { completeLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try { const r = await api.post('/platform/login', form); await completeLogin(r.data.token); }
    catch (err) { setError(errorMessage(err)); setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white w-full max-w-sm p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg text-white"><ShieldCheck className="w-5 h-5" /></div>
          <div><h1 className="font-bold text-slate-900">Platform console</h1><p className="text-xs text-slate-500">For the owner of this DeskFlow installation</p></div>
        </div>
        {error && <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
        <label className="block text-sm font-medium text-slate-700">Email<input type="email" required autoComplete="username" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="block text-sm font-medium text-slate-700">Password<PasswordInput required autoComplete="current-password" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button disabled={busy} className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-semibold">{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-xs text-slate-500 text-center">Looking for your company's support desk? <Link to="/workspace" className="text-indigo-600 font-semibold">Find your workspace</Link></p>
      </form>
    </div>
  );
}
