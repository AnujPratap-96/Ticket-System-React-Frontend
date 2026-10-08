import { useEffect, useRef } from 'react';
import { tokenStore } from '../api/client';

/**
 * Realtime "something changed" pings over WebSockets (Laravel Reverb). It is a bonus layer: if it is not
 * configured or the connection drops, every screen still refreshes by itself through normal polling.
 * Pings carry no ticket content; screens re-fetch through the authorised API.
 */
const KEY = import.meta.env.VITE_REVERB_APP_KEY;
let echoPromise = null;
let echoToken = null;

export const realtimeEnabled = () => Boolean(KEY);

async function getEcho() {
  const token = tokenStore.get();
  if (!KEY || !token) return null;
  if (echoPromise && echoToken !== token) stopRealtime();   // a different person signed in
  if (!echoPromise) {
    echoToken = token;
    echoPromise = (async () => {
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([import('laravel-echo'), import('pusher-js')]);
      window.Pusher = Pusher;
      const scheme = import.meta.env.VITE_REVERB_SCHEME || 'https';
      const api = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
      return new Echo({
        broadcaster: 'reverb',
        key: KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT || 80),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT || 443),
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${api}/broadcasting/auth`,
        auth: { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
      });
    })().catch(() => null);
  }
  return echoPromise;
}

export function stopRealtime() {
  const p = echoPromise;
  echoPromise = null;
  echoToken = null;
  p?.then((e) => e?.disconnect()).catch(() => {});
}

/**
 * Listen to a private channel while the component is mounted.
 * `events` is a map: { 'ticket.changed': handler } (names as sent by the server, no leading dot needed).
 */
export function useChannel(channel, events, enabled = true) {
  const handlers = useRef(events);
  handlers.current = events;

  useEffect(() => {
    if (!enabled || !channel || !realtimeEnabled()) return undefined;
    let cancelled = false;
    let ch = null;
    getEcho().then((echo) => {
      if (cancelled || !echo) return;
      ch = echo.private(channel);
      Object.keys(handlers.current).forEach((name) => ch.listen(`.${name}`, (data) => handlers.current[name]?.(data)));
    });
    return () => {
      cancelled = true;
      getEcho().then((echo) => echo?.leave(channel)).catch(() => {});
    };
  }, [channel, enabled]);
}
