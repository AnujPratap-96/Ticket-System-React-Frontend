import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/common/PasswordInput';

const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };

  const sendCode = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/auth/forgot-password', { email });
      setStep('reset');
      setCooldown(60);
      toast.success('If that email has an account, a reset code is on its way.', 'Check your email');
    });
  };

  const reset = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/auth/reset-password', { email, code, password, password_confirmation: confirm });
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    });
  };

  const resend = () => run(async () => {
    await api.post('/auth/forgot-password', { email });
    setCooldown(60);
    toast.info('If the account exists, a new code was sent.');
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LifeBuoy className="w-5 h-5" /></div>
          <h1 className="font-bold text-slate-900">Reset your password</h1>
        </div>
        {error && <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}

        {step === 'email' ? (
          <form onSubmit={sendCode} className="space-y-3">
            <p className="text-sm text-slate-600">Enter your account email and we will send you a 6-digit code.</p>
            <label className="block text-sm font-medium text-slate-700">Email
              <input type="email" required className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-semibold">{busy ? 'Sending…' : 'Send code'}</button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-3">
            <p className="text-sm text-slate-600">If <strong>{email}</strong> has an account, a code is on its way.</p>
            <label className="block text-sm font-medium text-slate-700">Code
              <input required inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className={`${input} text-center tracking-[0.5em] font-mono`} /></label>
            <label className="block text-sm font-medium text-slate-700">New password
              <PasswordInput required minLength={8} autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700">Confirm new password
              <PasswordInput required minLength={8} autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
            <button disabled={busy || code.length !== 6} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-semibold">{busy ? 'Saving…' : 'Update password'}</button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} className="text-slate-600 underline">Change email</button>
              <button type="button" disabled={cooldown > 0 || busy} onClick={resend} className="text-indigo-600 font-semibold disabled:text-slate-400">{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</button>
            </div>
          </form>
        )}
        <p className="text-sm text-center"><Link to="/login" className="text-indigo-600 font-semibold">Back to sign in</Link></p>
      </div>
    </div>
  );
}
