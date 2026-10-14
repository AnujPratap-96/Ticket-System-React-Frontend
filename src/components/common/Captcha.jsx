import { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
export const captchaEnabled = !!SITE_KEY;

let scriptPromise;
const loadScript = () => (scriptPromise ||= new Promise((resolve, reject) => {
  if (window.turnstile) return resolve();
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  s.async = true;
  s.onload = resolve;
  s.onerror = () => { scriptPromise = undefined; reject(new Error('captcha script failed')); };
  document.head.appendChild(s);
}));

/**
 * Cloudflare Turnstile human check. Renders nothing unless VITE_TURNSTILE_SITE_KEY is set (the API only asks for it
 * when TURNSTILE_SECRET is set). A token works once: change `resetKey` after each submit to get a fresh one.
 */
export default function Captcha({ onToken, resetKey = 0 }) {
  const box = useRef(null);
  useEffect(() => {
    if (!SITE_KEY || !box.current) return undefined;
    let id;
    let gone = false;
    onToken('');
    loadScript().then(() => {
      if (gone || !box.current) return;
      id = window.turnstile.render(box.current, { sitekey: SITE_KEY, callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') });
    }).catch(() => {});
    return () => { gone = true; if (id !== undefined) window.turnstile?.remove(id); };
  }, [resetKey, onToken]);

  return SITE_KEY ? <div ref={box} className="flex justify-center" aria-label="Human check" /> : null;
}
