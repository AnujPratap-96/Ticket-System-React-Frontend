/** The reply signature: the person's name and post, as Markdown. */
export const signatureOf = (user) => (user ? `**${user.name}**${user.job_title ? `  \n${user.job_title}` : ''}` : '');

/** Adds the signature once (never twice, e.g. when a template already contained {{signature}}). */
export function withSignature(body, user, enabled) {
  const sig = signatureOf(user);
  if (!enabled || !sig || body.includes(sig)) return body;
  return `${body.trimEnd()}\n\n${sig}`;
}

const KEY = 'deskflow_add_signature';
export const loadSignaturePref = () => { try { return localStorage.getItem(KEY) !== '0'; } catch { return true; } };
export const saveSignaturePref = (on) => { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* storage unavailable */ } };
