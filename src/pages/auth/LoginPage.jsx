import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../api/client';
import PasswordInput from '../../components/common/PasswordInput';
import { useT } from '../../context/PreferencesContext';
import { LanguageSelect, ThemeToggle } from '../../components/common/PreferenceControls';

export default function LoginPage() {
  const { login, submitTwoFactor } = useAuth();
  const t = useT();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (challenge) await submitTwoFactor(challenge, code.trim());
      else {
        const r = await login(email, password);
        if (r.challenge) setChallenge(r.challenge);
      }
    } catch (err) {
      const msg = errorMessage(err, 'Login failed');
      setError(msg);
      if (challenge && /expired|too many/i.test(msg)) { setChallenge(null); setCode(''); }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="absolute top-3 right-3 flex items-center gap-2"><LanguageSelect /><ThemeToggle /></div>
      <form onSubmit={submit} className="bg-white w-full max-w-sm p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4 my-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LifeBuoy className="w-5 h-5" /></div>
          <div>
            <h1 className="font-bold text-slate-900">DeskFlow Support</h1>
            <p className="text-xs text-slate-500">{t('login.title')}</p>
          </div>
        </div>
        {error && <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        {challenge ? (
          <label className="block text-sm font-medium text-slate-700">Authentication code
            <input autoFocus required autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code or recovery code"
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono" />
            <span className="block text-xs text-slate-500 mt-1">Open your authenticator app, or use one of your recovery codes.</span>
          </label>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-700">{t('login.email')}
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm font-medium text-slate-700">{t('login.password')}
              <PasswordInput required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </label>
          </>
        )}
        <div className="text-right -mt-2"><Link to="/forgot-password" className="text-xs text-indigo-600 font-semibold">{t('login.forgot')}</Link></div>
        <button disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-semibold">
          {busy ? '…' : challenge ? 'Verify' : t('login.signIn')}
        </button>
        <p className="text-sm text-slate-600 text-center">{t('login.newCustomer')} <Link to="/register" className="text-indigo-600 font-semibold">{t('login.createAccount')}</Link></p>
        <p className="text-sm text-slate-600 text-center"><Link to="/help" className="text-indigo-600 font-semibold">{t('login.browseHelp')}</Link></p>
      </form>
    </div>
  );
}
