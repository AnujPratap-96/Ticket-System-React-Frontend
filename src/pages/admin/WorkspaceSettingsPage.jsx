import { useCallback, useEffect, useState } from 'react';
import { Copy, Download, Mail, Palette, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { downloadFile } from '../../lib/download';
import { uploadLogo, validateAvatar } from '../../lib/upload';
import { applyBrandColor } from '../../lib/brand';

const field = 'mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white';
const card = 'bg-white border border-slate-200 rounded-xl p-5 space-y-3';
const primary = 'bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50';

function Branding() {
  const toast = useToast();
  const { refreshMe } = useAuth();
  const [b, setB] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => { api.get('/settings/branding').then((r) => setB(r.data)).catch((e) => toast.error(errorMessage(e))); }, [toast]);
  if (!b) return null;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.patch('/settings/branding', { name: b.name, brand_color: b.brand_color || null, sender_name: b.sender_name || null, reply_to_email: b.reply_to_email || null });
      setB(r.data); applyBrandColor(r.data.brand_color); await refreshMe();
      toast.success('Branding saved. New emails use it straight away.');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  const pick = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const bad = validateAvatar(file);
    if (bad) return toast.error(bad);
    setProgress(0);
    try { setB(await uploadLogo(file, setProgress)); await refreshMe(); toast.success('Logo updated'); } catch (err) { toast.error(errorMessage(err)); } finally { setProgress(null); }
  };
  const removeLogo = async () => {
    try { const r = await api.delete('/settings/branding/logo'); setB(r.data); await refreshMe(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <form onSubmit={save} className={card}>
      <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Palette className="w-4 h-4 text-indigo-600" />Branding</h2>
      <p className="text-sm text-slate-600">Your name, colour and logo appear in the app and in every email your customers receive.</p>
      <label className="block text-sm font-medium text-slate-700">Company name
        <input required minLength={2} maxLength={120} className={field} value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} /></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-slate-700">Brand colour
          <div className="flex items-center gap-2 mt-1">
            <input type="color" aria-label="Brand colour" value={b.brand_color || b.default_color} onChange={(e) => setB({ ...b, brand_color: e.target.value })} className="h-9 w-12 rounded border border-slate-300 bg-white" />
            <input pattern="#[0-9a-fA-F]{6}" placeholder={b.default_color} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono" value={b.brand_color || ''} onChange={(e) => setB({ ...b, brand_color: e.target.value })} />
          </div></label>
        <div className="text-sm font-medium text-slate-700">Logo
          <div className="flex items-center gap-3 mt-1">
            {b.logo_url ? <img src={b.logo_url} alt="Logo" className="h-9 max-w-[140px] object-contain border border-slate-200 rounded bg-white p-1" /> : <span className="text-xs text-slate-500">None</span>}
            {b.logo_uploads ? (
              <>
                <label className="text-indigo-600 font-semibold cursor-pointer text-sm">{progress === null ? (b.logo_url ? 'Change' : 'Upload') : `${progress}%`}<input type="file" accept=".jpg,.jpeg,.png,.webp" className="sr-only" onChange={pick} /></label>
                {b.logo_url && <button type="button" onClick={removeLogo} className="text-rose-600 text-sm font-semibold">Remove</button>}
              </>
            ) : <span className="text-xs text-slate-500">Logo uploads are not configured on this server.</span>}
          </div></div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-slate-700">Email sender name
          <input maxLength={120} placeholder={b.name} className={field} value={b.sender_name || ''} onChange={(e) => setB({ ...b, sender_name: e.target.value })} /></label>
        <label className="block text-sm font-medium text-slate-700">Replies go to
          <input type="email" placeholder="support@yourcompany.com" className={field} value={b.reply_to_email || ''} onChange={(e) => setB({ ...b, reply_to_email: e.target.value })} /></label>
      </div>
      <button disabled={busy} className={primary}>Save branding</button>
    </form>
  );
}

function EmailChannel() {
  const toast = useToast();
  const [s, setS] = useState(null);
  const [shown, setShown] = useState(null);
  const load = useCallback(() => { api.get('/settings/email-channel').then((r) => setS(r.data)).catch((e) => toast.error(errorMessage(e))); }, [toast]);
  useEffect(() => { load(); }, [load]);
  if (!s) return null;

  const enable = async () => {
    if (s.enabled && !window.confirm('Create a new secret? The old one stops working immediately and your mail service must be updated.')) return;
    try { const r = await api.post('/settings/email-channel/enable'); setShown(r.data); setS(r.data); } catch (err) { toast.error(errorMessage(err)); }
  };
  const disable = async () => {
    if (!window.confirm('Turn off email-to-ticket?')) return;
    try { await api.delete('/settings/email-channel'); setShown(null); load(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const setDept = async (id) => {
    try { const r = await api.patch('/settings/email-channel', { department_id: id || null }); setS(r.data); } catch (err) { toast.error(errorMessage(err)); }
  };
  const copy = (text) => navigator.clipboard?.writeText(text).then(() => toast.success('Copied'));

  return (
    <div className={card}>
      <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-600" />Email to tickets</h2>
      <p className="text-sm text-slate-600">Point your mail service’s inbound webhook (SendGrid, Mailgun, Postmark…) at the address below and emails to your support address become tickets. The secret belongs to this workspace only.</p>
      {s.enabled ? (
        <>
          <label className="block text-sm font-medium text-slate-700">New tickets go to
            <select className={field} value={s.department_id || ''} onChange={(e) => setDept(e.target.value)}>
              <option value="">Choose a department…</option>{s.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
          {shown?.secret ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm space-y-2">
              <div className="font-semibold text-amber-900">Copy this now: the secret is shown only once.</div>
              <div className="flex gap-2"><code className="flex-1 break-all text-xs bg-white border rounded px-2 py-1.5">{shown.webhook_url}</code>
                <button type="button" onClick={() => copy(shown.webhook_url)} aria-label="Copy webhook URL" className="border rounded px-2"><Copy className="w-4 h-4" /></button></div>
              <p className="text-xs text-amber-800">Or send the secret in an <code>X-Webhook-Secret</code> header to <code>{s.webhook_base}</code>.</p>
            </div>
          ) : <p className="text-sm text-slate-500">A secret is set. For safety it cannot be shown again; create a new one if you lost it.</p>}
          <div className="flex gap-2">
            <button type="button" onClick={enable} className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold">Create a new secret</button>
            <button type="button" onClick={disable} className="text-rose-600 text-sm font-semibold px-2">Turn off</button>
          </div>
        </>
      ) : <button type="button" onClick={enable} className={primary}>Turn on email to tickets</button>}
    </div>
  );
}

function Security() {
  const toast = useToast();
  const { refreshMe, twoFactorEnabled } = useAuth();
  const [on, setOn] = useState(null);
  useEffect(() => { api.get('/settings/security').then((r) => setOn(r.data.require_two_factor)).catch((e) => toast.error(errorMessage(e))); }, [toast]);
  if (on === null) return null;

  const toggle = async () => {
    try { const r = await api.patch('/settings/security', { require_two_factor: !on }); setOn(r.data.require_two_factor); await refreshMe(); toast.success(r.data.require_two_factor ? 'Two-factor is now required for all staff' : 'Two-factor is optional again'); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className={card}>
      <h2 className="font-semibold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" />Security</h2>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium text-slate-900">Require two-factor sign-in for staff</div>
          <p className="text-sm text-slate-600">Agents, leads and admins without an authenticator app must set one up before they can do anything else.{!twoFactorEnabled && !on && ' Turn on two-factor for your own account first (My account).'}</p>
        </div>
        <button role="switch" aria-checked={on} onClick={toggle} className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-300'}`}>
          <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
          <span className="sr-only">{on ? 'On' : 'Off'}</span>
        </button>
      </div>
    </div>
  );
}

function Export() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await downloadFile('/settings/export', 'workspace-export.json');
    } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <div className={card}>
      <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Download className="w-4 h-4 text-indigo-600" />Export your data</h2>
      <p className="text-sm text-slate-600">Download everything in this workspace (people, organizations, tickets, public replies, help articles) as one JSON file. Passwords and secrets are never included. Limited to 3 exports an hour.</p>
      <button onClick={run} disabled={busy} className={primary}>{busy ? 'Preparing…' : 'Download export'}</button>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Workspace settings</h1>
      <Branding />
      <EmailChannel />
      <Security />
      <Export />
    </div>
  );
}
