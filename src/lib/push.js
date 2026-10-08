import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const supported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const toBytes = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/** Turn a browser/server failure into something a person can act on. */
function explain(e) {
  const status = e?.response?.status;
  if (status === 422) return e.response.data?.message || 'This browser\'s push address was not accepted by the server.';
  if (status === 503) return 'Push notifications are not set up on the server (missing VAPID keys).';
  if (status === 401) return 'Please sign in again and retry.';
  if (e?.name === 'AbortError' || /push service/i.test(e?.message || '')) {
    return 'Your browser could not reach its push service. This happens in browsers without Google/Mozilla push support (e.g. some Chromium builds, Brave with "Use Google Services for Push Messaging" off), on blocked networks or in private windows. Try normal Chrome, Edge or Firefox.';
  }
  if (e?.name === 'NotAllowedError') return 'Notification permission was denied. Allow notifications for this site in the browser and try again.';
  if (e?.name === 'InvalidStateError') return 'An old subscription exists for a different key. Turn notifications off, reload, then on again.';
  return e?.message || 'Unknown error';
}

/** Browser push for this device: state + turn on / off. */
export function usePush() {
  const [state, setState] = useState({ ready: false, supported: supported(), serverReady: false, permission: supported() ? Notification.permission : 'denied', subscribed: false, busy: false });

  const refresh = useCallback(async () => {
    if (!supported()) { setState((s) => ({ ...s, ready: true })); return; }
    try {
      const [{ data }, reg] = await Promise.all([api.get('/push/key'), navigator.serviceWorker.ready]);
      const sub = await reg.pushManager.getSubscription();
      setState((s) => ({ ...s, ready: true, serverReady: !!data.public_key, key: data.public_key, permission: Notification.permission, subscribed: !!sub }));
    } catch {
      setState((s) => ({ ...s, ready: true }));
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const enable = useCallback(async () => {
    setState((s) => ({ ...s, busy: true }));
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return { ok: false, reason: permission === 'denied' ? 'blocked' : 'dismissed' };
      const { data } = await api.get('/push/key');
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(data.public_key) });
      await api.post('/push/subscribe', sub.toJSON());
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: 'error', detail: explain(e) };
    } finally {
      await refresh();
      setState((s) => ({ ...s, busy: false }));
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setState((s) => ({ ...s, busy: true }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); }
      return { ok: true };
    } finally {
      await refresh();
      setState((s) => ({ ...s, busy: false }));
    }
  }, [refresh]);

  return { ...state, enable, disable };
}

/** "Install app" (Chrome/Edge/Android): remember the browser's prompt until the user asks for it. */
export function useInstallPrompt() {
  const [evt, setEvt] = useState(null);
  const [installed, setInstalled] = useState(typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches);
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setEvt(e); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const install = async () => { if (!evt) return; evt.prompt(); await evt.userChoice; setEvt(null); };
  return { canInstall: !!evt && !installed, installed, install };
}
