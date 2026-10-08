import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/common/PasswordInput';

const input = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm';

export default function RegisterPage() {
  const { completeLogin } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
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
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitDetails = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post('/auth/register', form);
      setStep('otp');
      setCooldown(60);
      setInfo(`We sent a 6-digit code to ${form.email}.`);
      toast.success(`We sent a 6-digit code to ${form.email}.`, 'Check your email');
    });
  };

  const submitCode = (e) => {
    e.preventDefault();
    run(async () => {
      const res = await api.post('/auth/verify-otp', { email: form.email, code });
      await completeLogin(res.data.token);
      toast.success('Your email is verified and your account is ready.', 'Welcome to DeskFlow');
    });
  };

  const resend = () => run(async () => {
    await api.post('/auth/resend-otp', { email: form.email });
    setCooldown(60);
    setInfo('A new code was sent.');
    toast.success('A new code is on its way.', 'Code resent');
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LifeBuoy className="w-5 h-5" /></div>
          <div>
            <h1 className="font-bold text-slate-900">Create your account</h1>
            <p className="text-xs text-slate-500">{step === 'details' ? 'Step 1 of 2: your details' : 'Step 2 of 2: verify your email'}</p>
          </div>
        </div>
        {error && <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</div>}
        {info && step === 'otp' && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{info}</div>}

        {step === 'details' ? (
          <form onSubmit={submitDetails} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Full name
              <input required maxLength={255} className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Email
              <input type="email" required className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Password
              <PasswordInput required minLength={8} autoComplete="new-password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label className="block text-sm font-medium text-slate-700">Confirm password
              <PasswordInput required minLength={8} autoComplete="new-password" className={input} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} /></label>
            <button disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-semibold">
              {busy ? 'Sending code…' : 'Send verification code'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Verification code
              <input required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className={`${input} text-center tracking-[0.5em] text-lg font-mono`} />
            </label>
            <button disabled={busy || code.length !== 6} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 text-sm font-semibold">
              {busy ? 'Verifying…' : 'Verify and create account'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep('details'); setCode(''); setError(''); }} className="text-slate-600 underline">Change email</button>
              <button type="button" disabled={cooldown > 0 || busy} onClick={resend} className="text-indigo-600 font-semibold disabled:text-slate-400">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
        <p className="text-sm text-slate-600 text-center">Already have an account? <Link to="/login" className="text-indigo-600 font-semibold">Sign in</Link></p>
      </div>
    </div>
  );
}
