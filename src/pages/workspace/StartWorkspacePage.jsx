import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, LifeBuoy, X } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { setTenant, usesSubdomains, workspaceUrl } from '../../lib/tenant';
import { useToast } from '../../context/ToastContext';
import Captcha, { captchaEnabled } from '../../components/common/Captcha';
import PasswordInput from '../../components/common/PasswordInput';

const field = 'mt-1 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

/** A company creates its own workspace: details, then the code we email. */
export default function StartWorkspacePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [captcha, setCaptcha] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [form, setForm] = useState({ workspace_name: '', slug: '', admin_name: '', email: '', password: '', password_confirmation: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [avail, setAvail] = useState(null); // null | true | false
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === 'workspace_name' && !slugTouched ? { slug: slugify(v) } : {}) }));

  useEffect(() => {
    if (!form.slug) { setAvail(null); return undefined; }
    const t = setTimeout(() => { api.get('/workspaces/available', { params: { slug: form.slug } }).then((r) => setAvail(r.data.available)).catch(() => setAvail(null)); }, 350);
    return () => clearTimeout(t);
  }, [form.slug]);

  const register = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/workspaces/register', { ...form, captcha_token: captcha }); setStep(2); toast.info(`We sent a code to ${form.email}.`, 'Check your email'); }
    catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); setCaptchaKey((k) => k + 1); }
  };

  const verify = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post('/workspaces/verify', { email: form.email, code });
      setTenant(r.data.tenant.slug);
      toast.success(`${r.data.tenant.name} is ready. Sign in with the email and password you just chose.`, 'Workspace created');
      if (usesSubdomains()) window.location.assign(workspaceUrl(r.data.tenant.slug)); else navigate('/login');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><LifeBuoy className="w-5 h-5" /></div>
          <div><h1 className="font-bold text-slate-900">Create your workspace</h1><p className="text-xs text-slate-500">A private support desk for your company</p></div>
        </div>

        {step === 1 ? (
          <form onSubmit={register} className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Company name
              <input required minLength={2} maxLength={120} className={field} value={form.workspace_name} onChange={(e) => set('workspace_name', e.target.value)} placeholder="Acme Support" /></label>
            <label className="block text-sm font-medium text-slate-700">Workspace address
              <input required className={field} value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }} placeholder="acme-support" />
              <span className="flex items-center gap-1 text-xs mt-1 min-h-4">
                {avail === true && <><Check className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-700">Available</span></>}
                {avail === false && <><X className="w-3.5 h-3.5 text-rose-600" /><span className="text-rose-700">Not available. Try another.</span></>}
                {avail === null && <span className="text-slate-500">Letters, numbers and dashes. Your people use this to find your support site.</span>}
              </span></label>
            <label className="block text-sm font-medium text-slate-700">Your name
              <input required minLength={2} className={field} value={form.admin_name} onChange={(e) => set('admin_name', e.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700">Work email (you will be the administrator)
              <input type="email" required className={field} value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700">Password
              <PasswordInput required minLength={10} autoComplete="new-password" className={field} value={form.password} onChange={(e) => set('password', e.target.value)} /></label>
            <label className="block text-sm font-medium text-slate-700">Confirm password
              <PasswordInput required minLength={10} autoComplete="new-password" className={field} value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} /></label>
            <Captcha onToken={setCaptcha} resetKey={captchaKey} />
            <button disabled={busy || (captchaEnabled && !captcha) || avail === false || form.password.length < 10 || form.password !== form.password_confirmation} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">{busy ? 'Sending code…' : 'Send me a code'}</button>
            {form.password_confirmation && form.password !== form.password_confirmation && <p className="text-xs text-rose-600">The two passwords do not match.</p>}
          </form>
        ) : (
          <form onSubmit={verify} className="space-y-4">
            <p className="text-sm text-slate-600">Enter the 6-digit code we emailed to <strong>{form.email}</strong>.</p>
            <input autoFocus required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} aria-label="Verification code" className={`${field} text-center tracking-[0.5em] font-mono text-lg`} />
            <button disabled={busy || code.length !== 6} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">{busy ? 'Creating…' : 'Create my workspace'}</button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-slate-500 hover:text-slate-800">Go back</button>
          </form>
        )}
        <p className="text-sm text-slate-600 text-center">Already have one? <Link to="/workspace" className="text-indigo-600 font-semibold">Find your workspace</Link></p>
      </div>
    </div>
  );
}
