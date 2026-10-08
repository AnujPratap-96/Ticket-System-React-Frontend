import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle, BadgeCheck, Bell, PenLine, Building2, Camera, Check, Copy, Download, KeyRound, Lock, Mail,
  LogOut, Monitor, Pencil, ShieldAlert, ShieldCheck, Smartphone, Trash2, UserRound, X,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { downloadFile } from '../../lib/download';
import { fmt } from '../../lib';
import { useInstallPrompt, usePush } from '../../lib/push';
import { uploadAvatar, validateAvatar } from '../../lib/upload';
import Avatar from '../../components/common/Avatar';
import BrandMark from '../../components/common/BrandMark';
import PasswordInput from '../../components/common/PasswordInput';
import { RichBody } from '../../components/common/RichEditor';
import { signatureOf } from '../../lib/signature';

const field = 'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500';
const btnPrimary = 'inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors';
const btnGhost = 'inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors';

const ROLE_STYLE = {
  admin: 'bg-rose-50 text-rose-700 ring-rose-200',
  lead: 'bg-amber-50 text-amber-800 ring-amber-200',
  agent: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  customer: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

function Chip({ icon: Icon, tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
      {Icon && <Icon className="w-3.5 h-3.5" aria-hidden="true" />}{children}
    </span>
  );
}

function Card({ icon: Icon, title, description, tone = 'default', children }) {
  const danger = tone === 'danger';
  return (
    <section className={`rounded-2xl border bg-white shadow-sm ${danger ? 'border-rose-200' : 'border-slate-200'}`}>
      <header className="flex items-start gap-3 px-6 pt-5">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
          <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
        </span>
        <div>
          <h2 className={`text-base font-semibold ${danger ? 'text-rose-700' : 'text-slate-900'}`}>{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      </header>
      <div className="px-6 pb-6 pt-4">{children}</div>
    </section>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
      <dt className="w-32 shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-medium text-slate-900 truncate">{children}</dd>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout, twoFactorEnabled, refreshMe, updateUser } = useAuth();
  const toast = useToast();

  // profile
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState(user.job_title || '');
  const [sigHtml, setSigHtml] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInput = useRef(null);

  // two-factor
  const [setup, setSetup] = useState(null);
  const [tfCode, setTfCode] = useState('');
  const [tfPassword, setTfPassword] = useState('');
  const [recovery, setRecovery] = useState(null);
  const [disabling, setDisabling] = useState(false);
  const [tfBusy, setTfBusy] = useState(false);
  const qr = useRef(null);

  const push = usePush();
  const installer = useInstallPrompt();

  // password + sessions
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [sessions, setSessions] = useState(null);

  // privacy
  const [password, setPassword] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadSessions = () => api.get('/auth/sessions').then((r) => setSessions(r.data.sessions)).catch(() => setSessions([]));
  useEffect(() => { loadSessions(); }, []);

  const changePassword = async (e) => {
    e.preventDefault();
    setPwBusy(true);
    try {
      const res = await api.patch('/auth/password', pw);
      setPw({ current_password: '', password: '', password_confirmation: '' });
      toast.success(res.data.message, 'Password changed');
      loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  const signOutDevice = async (s) => {
    try {
      await api.delete(`/auth/sessions/${s.id}`);
      if (s.current) { await logout(); return; }
      toast.success(`${s.device} was signed out.`, 'Device signed out');
      loadSessions();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const signOutOthers = async () => {
    try {
      const res = await api.post('/auth/sessions/revoke-others');
      toast.success(res.data.message, 'Other devices signed out');
      loadSessions();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  useEffect(() => {
    if (setup && qr.current) QRCode.toCanvas(qr.current, setup.otpauth_url, { width: 176, margin: 1 }).catch(() => {});
  }, [setup]);

  const saveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await api.patch('/auth/profile', { name: nameDraft });
      updateUser(res.data.user);
      setEditingName(false);
      toast.success(`Your name is now ${res.data.user.name}.`, 'Name updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingName(false);
    }
  };

  const saveTitle = async (e) => {
    e.preventDefault();
    setSavingTitle(true);
    try {
      const res = await api.patch('/auth/profile', { name: user.name, job_title: titleDraft });
      updateUser(res.data.user);
      toast.success('Your signature was updated.', 'Signature saved');
    } catch (err) { toast.error(errorMessage(err)); } finally { setSavingTitle(false); }
  };

  // The signature preview is rendered by the server, so it matches what customers receive.
  useEffect(() => {
    const t = setTimeout(() => {
      api.post('/rich-text/preview', { body: signatureOf({ name: user.name, job_title: titleDraft.trim() }) }).then((r) => setSigHtml(r.data.html)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [user.name, titleDraft]);

  const choosePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateAvatar(file);
    if (problem) { toast.error(problem, 'Photo not accepted'); return; }

    const local = URL.createObjectURL(file); // instant preview while uploading
    setPreview(local);
    setPhotoProgress(0);
    try {
      const updated = await uploadAvatar(file, setPhotoProgress);
      updateUser(updated);
      toast.success('Your new photo now shows next to your messages.', 'Photo updated');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not upload the photo'));
    } finally {
      setPhotoProgress(null);
      setPreview(null);
      URL.revokeObjectURL(local);
    }
  };

  const removePhoto = async () => {
    try {
      const res = await api.delete('/auth/avatar');
      updateUser(res.data.user);
      toast.success('Your initial is shown instead.', 'Photo removed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const startSetup = async () => {
    setTfBusy(true);
    try { const res = await api.post('/2fa/setup'); setSetup(res.data); setTfCode(''); } catch (err) { toast.error(errorMessage(err)); } finally { setTfBusy(false); }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    setTfBusy(true);
    try {
      const res = await api.post('/2fa/confirm', { code: tfCode });
      setRecovery(res.data.recovery_codes);
      setSetup(null);
      setTfCode('');
      await refreshMe();
      toast.success('You will be asked for a code each time you sign in.', 'Two-factor authentication on');
    } catch (err) { toast.error(errorMessage(err)); } finally { setTfBusy(false); }
  };

  const disable = async (e) => {
    e.preventDefault();
    setTfBusy(true);
    try {
      await api.post('/2fa/disable', { password: tfPassword, code: tfCode });
      toast.success('Your account now uses a password only.', 'Two-factor authentication off');
      setDisabling(false); setTfCode(''); setTfPassword('');
      await refreshMe();
    } catch (err) { toast.error(errorMessage(err)); } finally { setTfBusy(false); }
  };

  const copyCodes = async () => {
    try { await navigator.clipboard.writeText(recovery.join('\n')); toast.success('Paste them somewhere safe.', 'Recovery codes copied'); }
    catch { toast.error('Select the codes and copy them manually.', 'Could not copy'); }
  };

  const exportData = async () => {
    try { await downloadFile('/me/export', 'my-data.json'); toast.success('my-data.json was saved to your downloads.', 'Download ready'); }
    catch (err) { toast.error(errorMessage(err, 'Export failed')); }
  };

  const erase = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.delete('/me', { data: { password } });
      await logout();
      toast.success('Your personal data has been removed.', 'Account deleted');
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  const isCustomer = user.role === 'customer';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ---------- Profile header ---------- */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" aria-label="Profile">
        {/* Brand banner: the DeskFlow logo on the brand colour, with a soft lifebuoy watermark */}
        <div className="relative h-32 sm:h-40 overflow-hidden bg-[#4f46e5]">
          <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.18), transparent 50%)' }} />
          <BrandMark className="absolute -right-6 -bottom-14 h-52 w-52 sm:h-64 sm:w-64 text-white opacity-[0.09]" />
          <BrandMark className="absolute -left-10 -top-16 h-40 w-40 text-white opacity-[0.06]" />
          <div className="relative flex h-full items-center justify-center sm:justify-end sm:pr-10">
            <img src="/brand/logo-white.png" alt="DeskFlow Support" width="409" height="106" className="h-12 w-auto sm:h-[60px] drop-shadow-sm select-none" draggable="false" />
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* avatar: click to change */}
            <div className="relative shrink-0 self-start -mt-14 sm:-mt-16">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={photoProgress !== null}
                aria-label={user.avatar_url ? 'Change profile photo' : 'Upload profile photo'}
                className="group relative block rounded-full ring-4 ring-white shadow-md focus:outline-none focus-visible:ring-indigo-500"
              >
                {preview ? <img src={preview} alt="" className="w-28 h-28 rounded-full object-cover" /> : <Avatar user={user} size={112} />}
                <span className="absolute inset-0 rounded-full bg-slate-900/50 text-white flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity text-xs font-semibold">
                  <Camera className="w-5 h-5" aria-hidden="true" />Change
                </span>
                {photoProgress !== null && (
                  <span role="progressbar" aria-valuenow={photoProgress} className="absolute inset-0 rounded-full bg-slate-900/60 text-white text-sm font-bold flex items-center justify-center">{photoProgress}%</span>
                )}
              </button>
              <input ref={fileInput} type="file" hidden accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={choosePhoto} />
            </div>

            {/* name + meta */}
            <div className="min-w-0 flex-1 sm:pt-4">
              {editingName ? (
                <form onSubmit={saveName} className="flex items-center gap-2 max-w-md">
                  <input autoFocus required minLength={2} maxLength={100} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} aria-label="Your name" className={field} />
                  <button disabled={savingName || nameDraft.trim().length < 2} aria-label="Save name" className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-50"><Check className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setEditingName(false)} aria-label="Cancel" className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50"><X className="w-4 h-4" /></button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 truncate">{user.name}</h1>
                  <button onClick={() => { setNameDraft(user.name); setEditingName(true); }} aria-label="Edit name" title="Edit name" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                </div>
              )}
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ring-inset ${ROLE_STYLE[user.role]}`}>{user.role}</span>
                <Chip icon={BadgeCheck} tone="green">Email verified</Chip>
                <Chip icon={twoFactorEnabled ? ShieldCheck : ShieldAlert} tone={twoFactorEnabled ? 'green' : 'amber'}>{twoFactorEnabled ? '2FA on' : '2FA off'}</Chip>
                {user.department && <Chip icon={Building2}>{user.department.name}</Chip>}
              </div>
            </div>

            {/* photo actions */}
            <div className="flex items-center gap-2 sm:pt-4">
              <button onClick={() => fileInput.current?.click()} disabled={photoProgress !== null} className={btnGhost}>
                <Camera className="w-4 h-4" aria-hidden="true" />{user.avatar_url ? 'Change photo' : 'Upload photo'}
              </button>
              {user.avatar_url && photoProgress === null && (
                <button onClick={removePhoto} className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50" aria-label="Remove photo" title="Remove photo"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">JPG, PNG or WEBP, up to 2 MB. Your photo and name appear next to your messages.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* ---------- Personal information ---------- */}
          <Card icon={UserRound} title="Personal information" description="How you appear to others on DeskFlow.">
            <dl className="divide-y divide-slate-100">
              <InfoRow icon={UserRound} label="Full name">
                {user.name}
                <button onClick={() => { setNameDraft(user.name); setEditingName(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="ml-2 text-xs font-semibold text-indigo-600 hover:underline">Edit</button>
              </InfoRow>
              <InfoRow icon={Mail} label="Email address">
                {user.email}
                <Lock className="inline w-3.5 h-3.5 ml-2 text-slate-400" aria-label="Cannot be changed" />
              </InfoRow>
              <InfoRow icon={KeyRound} label="Account type"><span className="capitalize">{user.role}</span></InfoRow>
              {user.department && <InfoRow icon={Building2} label="Department">{user.department.name}</InfoRow>}
            </dl>
            <p className="mt-4 text-xs text-slate-400">Your email address is your login, so it cannot be changed here.</p>
          </Card>

          {/* ---------- Reply signature (staff) ---------- */}
          {user.role !== 'customer' && (
            <Card icon={PenLine} title="Reply signature" description="Added to the end of your replies to customers (you can switch it off per reply).">
              <form onSubmit={saveTitle} className="space-y-4 max-w-md">
                <label className="block text-sm font-medium text-slate-700">Job title
                  <input maxLength={100} value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} placeholder="e.g. Senior Support Engineer" className={`${field} mt-1`} />
                </label>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Preview</div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><RichBody html={sigHtml} text={signatureOf(user)} /></div>
                  <p className="mt-1 text-xs text-slate-500">Your name comes from your profile above. Use <code>{'{{signature}}'}</code> inside a canned reply to place it yourself.</p>
                </div>
                <button disabled={savingTitle || titleDraft.trim() === (user.job_title || '')} className={btnPrimary}>{savingTitle ? 'Saving…' : 'Save signature'}</button>
              </form>
            </Card>
          )}

          {/* ---------- Security ---------- */}
          <Card icon={ShieldCheck} title="Two-factor authentication" description="Protect your account with a code from an authenticator app when you sign in.">
            {recovery && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm font-semibold">Save these recovery codes now. They will not be shown again.</p>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-sm text-amber-950">{recovery.map((c) => <li key={c}>{c}</li>)}</ul>
                <div className="mt-4 flex gap-2">
                  <button onClick={copyCodes} className={btnGhost}><Copy className="w-4 h-4" aria-hidden="true" />Copy all</button>
                  <button onClick={() => setRecovery(null)} className={btnPrimary}>I have saved them</button>
                </div>
              </div>
            )}

            {twoFactorEnabled ? (
              !disabling ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2"><Chip icon={ShieldCheck} tone="green">Enabled</Chip><span className="text-sm text-slate-600">You will be asked for a code when you sign in.</span></div>
                  <button onClick={() => setDisabling(true)} className={btnGhost}>Turn off…</button>
                </div>
              ) : (
                <form onSubmit={disable} className="space-y-3 max-w-md">
                  <PasswordInput required placeholder="Your password" autoComplete="current-password" value={tfPassword} onChange={(e) => setTfPassword(e.target.value)} className={field} />
                  <input required placeholder="Authenticator or recovery code" value={tfCode} onChange={(e) => setTfCode(e.target.value)} className={field} />
                  <div className="flex gap-2">
                    <button disabled={tfBusy} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold">Turn off 2FA</button>
                    <button type="button" onClick={() => setDisabling(false)} className={btnGhost}>Cancel</button>
                  </div>
                </form>
              )
            ) : setup ? (
              <form onSubmit={confirmSetup} className="grid gap-6 sm:grid-cols-[auto,1fr] items-start">
                <div className="rounded-xl border border-slate-200 p-2 bg-white w-fit"><canvas ref={qr} aria-label="QR code for your authenticator app" /></div>
                <div className="space-y-4">
                  <ol className="space-y-2 text-sm text-slate-600 list-decimal pl-5">
                    <li>Open an authenticator app (Google Authenticator, Authy, 1Password).</li>
                    <li>Scan the QR code, or enter this key: <code className="font-mono text-xs break-all bg-slate-100 rounded px-1.5 py-0.5">{setup.secret}</code></li>
                    <li>Type the 6-digit code the app shows.</li>
                  </ol>
                  <input required inputMode="numeric" maxLength={6} placeholder="123456" value={tfCode} onChange={(e) => setTfCode(e.target.value.replace(/\D/g, ''))} aria-label="6-digit code" className={`${field} w-44 text-center font-mono tracking-[0.35em] text-base`} />
                  <div className="flex gap-2">
                    <button disabled={tfCode.length !== 6 || tfBusy} className={btnPrimary}>Turn on</button>
                    <button type="button" onClick={() => setSetup(null)} className={btnGhost}>Cancel</button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Chip icon={ShieldAlert} tone="amber">Not enabled</Chip><span className="text-sm text-slate-600">{isCustomer ? 'Recommended for extra safety.' : 'Strongly recommended for staff accounts.'}</span></div>
                <button onClick={startSetup} disabled={tfBusy} className={btnPrimary}>Set up</button>
              </div>
            )}
          </Card>

          {/* ---------- Password ---------- */}
          <Card icon={KeyRound} title="Password" description="Use a long, unique password. Changing it signs out your other devices.">
            <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2 max-w-xl">
              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Current password
                <PasswordInput required autoComplete="current-password" className={`${field} mt-1`} value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-slate-700">New password
                <PasswordInput required minLength={8} autoComplete="new-password" className={`${field} mt-1`} value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-slate-700">Confirm new password
                <PasswordInput required minLength={8} autoComplete="new-password" className={`${field} mt-1`} value={pw.password_confirmation} onChange={(e) => setPw({ ...pw, password_confirmation: e.target.value })} />
              </label>
              {pw.password_confirmation && pw.password !== pw.password_confirmation && <p className="text-xs text-rose-600 sm:col-span-2">The two new passwords do not match.</p>}
              <div className="sm:col-span-2"><button disabled={pwBusy || pw.password.length < 8 || pw.password !== pw.password_confirmation} className={btnPrimary}>{pwBusy ? 'Saving…' : 'Change password'}</button></div>
            </form>
          </Card>

          {/* ---------- Notifications on this device ---------- */}
          <Card icon={Bell} title="Notifications on this device" description="Get a pop-up when a ticket needs you, even when DeskFlow is closed.">
            {!push.ready ? <p className="text-sm text-slate-500">Checking…</p>
              : !push.supported ? <p className="text-sm text-slate-500">This browser does not support push notifications.</p>
              : !push.serverReady ? <p className="text-sm text-slate-500">Push notifications are not set up on this server yet.</p>
              : push.permission === 'denied' ? <p className="text-sm text-amber-700">Notifications are blocked for this site. Allow them in your browser's site settings, then come back.</p>
              : push.subscribed ? (
                <div className="flex flex-wrap items-center gap-3"><Chip tone="green">On for this device</Chip>
                  <button disabled={push.busy} onClick={async () => { await push.disable(); toast.info('Notifications are off for this device.'); }} className={btnGhost}>Turn off</button></div>
              ) : (
                <button disabled={push.busy} onClick={async () => { const r = await push.enable(); if (r.ok) toast.success('You will now get pop-ups on this device.', 'Notifications on'); else if (r.reason === 'blocked') toast.error('Notifications are blocked for this site. Allow them in your browser\'s site settings.', 'Blocked'); else if (r.reason === 'error') toast.error(r.detail, 'Could not turn notifications on'); }} className={btnPrimary}>{push.busy ? 'Turning on…' : 'Turn on notifications'}</button>
              )}
            {installer.canInstall && <div className="mt-4 pt-4 border-t border-slate-100"><button onClick={installer.install} className={btnGhost}><Download className="w-4 h-4" aria-hidden="true" />Install DeskFlow as an app</button></div>}
          </Card>

          {/* ---------- Sessions ---------- */}
          <Card icon={Monitor} title="Where you're signed in" description="Sign out any device you don't recognise.">
            {!sessions ? <p className="text-sm text-slate-500">Loading…</p> : (
              <>
                <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {sessions.map((s) => {
                    const Icon = /iOS|Android/.test(s.device) ? Smartphone : Monitor;
                    return (
                      <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Icon className="w-4 h-4" aria-hidden="true" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900 truncate">{s.device}{s.current && <span className="ml-2 align-middle"><Chip tone="green">This device</Chip></span>}</div>
                          <div className="text-xs text-slate-500">Last active {fmt(s.last_used_at || s.created_at)}</div>
                        </div>
                        <button onClick={() => signOutDevice(s)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg px-2.5 py-1.5"><LogOut className="w-3.5 h-3.5" aria-hidden="true" />{s.current ? 'Sign out' : 'Remove'}</button>
                      </li>
                    );
                  })}
                </ul>
                {sessions.length > 1 && <button onClick={signOutOthers} className={`${btnGhost} mt-4`}>Sign out all other devices</button>}
              </>
            )}
          </Card>
        </div>

        {/* ---------- Right column ---------- */}
        <div className="space-y-6">
          <Card icon={Download} title="Your data" description="Get a copy of everything we hold about you.">
            <p className="text-sm text-slate-600 mb-4">Your profile, tickets, replies and ratings in one JSON file.</p>
            <button onClick={exportData} className={`${btnGhost} w-full`}><Download className="w-4 h-4" aria-hidden="true" />Download my data</button>
          </Card>

          {isCustomer ? (
            <Card icon={AlertTriangle} tone="danger" title="Delete account" description="This cannot be undone.">
              <p className="text-sm text-slate-600">Your name, email and the text of your messages are permanently removed. Ticket records stay in anonymised form.</p>
              {!confirming ? (
                <button onClick={() => setConfirming(true)} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2.5 text-sm font-semibold"><Trash2 className="w-4 h-4" aria-hidden="true" />Delete my account…</button>
              ) : (
                <form onSubmit={erase} className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Confirm your password
                    <PasswordInput required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} mt-1`} />
                  </label>
                  <div className="flex gap-2">
                    <button disabled={busy} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl px-4 py-2.5 text-sm font-semibold">{busy ? 'Deleting…' : 'Delete forever'}</button>
                    <button type="button" onClick={() => { setConfirming(false); setPassword(''); }} className={btnGhost}>Cancel</button>
                  </div>
                </form>
              )}
            </Card>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
              Staff accounts are deactivated by an administrator rather than deleted, so ticket history stays intact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
