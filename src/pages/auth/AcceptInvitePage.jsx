import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PasswordInput from '../../components/common/PasswordInput';

const field = 'mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';

/** Landing page of the invitation email: the invited person chooses their own password. */
export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const { completeLogin } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState(null);
  const [problem, setProblem] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!email || !token) { setProblem('This invitation link is incomplete. Open the link from your invitation email.'); return; }
    api.get('/auth/invite-info', { params: { email, token } })
      .then((r) => setInfo(r.data))
      .catch((e) => setProblem(errorMessage(e, 'This invitation link is invalid or has expired.')));
  }, [email, token]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post('/auth/accept-invite', { email, token, password, password_confirmation: confirm });
      await completeLogin(res.data.token);
      toast.success('Your account is ready. You are signed in.', 'Welcome to the team');
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="bg-white w-full max-w-sm p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4 my-auto">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LifeBuoy className="w-5 h-5" /></div>
          <div><h1 className="font-bold text-slate-900">Accept your invitation</h1><p className="text-xs text-slate-500">DeskFlow Support</p></div>
        </div>

        {problem && (
          <div role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-3">
            {problem} <Link to="/login" className="underline font-semibold">Go to sign in</Link>
          </div>
        )}
        {!problem && !info && <p className="text-sm text-slate-500">Checking your invitation…</p>}

        {info && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-slate-600">Hi <strong>{info.name}</strong>, you were invited as <strong className="capitalize">{info.role === 'lead' ? 'team lead' : info.role}</strong>. Choose a password to finish setting up <span className="font-medium">{info.email}</span>.</p>
            <label className="block text-sm font-medium text-slate-700">New password
              <PasswordInput required minLength={8} autoComplete="new-password" className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-slate-700">Confirm password
              <PasswordInput required minLength={8} autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </label>
            <button disabled={busy || password.length < 8 || password !== confirm} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">{busy ? 'Activating…' : 'Activate my account'}</button>
            {confirm && password !== confirm && <p className="text-xs text-rose-600">The two passwords do not match.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
