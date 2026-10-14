/**
 * Which workspace (company) is this browser talking to?
 *   1. the address:           acme.deskflow.com            (when VITE_TENANT_BASE_DOMAIN is set)
 *   2. a link:                /login?tenant=acme           (emails use this; it is remembered)
 *   3. what was chosen before (localStorage)
 *   4. VITE_DEFAULT_TENANT    (local development)
 * With only one workspace on the server, none of this is needed: the API picks it.
 */
const KEY = 'deskflow_tenant';
const BASE = import.meta.env.VITE_TENANT_BASE_DOMAIN;

const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const write = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* storage unavailable */ } };

export function getTenant() {
  if (BASE && window.location.hostname.endsWith(`.${BASE}`)) return clean(window.location.hostname.slice(0, -(BASE.length + 1)));

  const fromLink = clean(new URLSearchParams(window.location.search).get('tenant'));
  if (fromLink) { write(fromLink); return fromLink; }

  return clean(read()) || clean(import.meta.env.VITE_DEFAULT_TENANT) || null;
}

export const setTenant = (slug) => write(clean(slug));
export const clearTenant = () => write(null);

/** Wildcard-domain installs keep the workspace in the address, so switching means going to another address. */
export const usesSubdomains = () => Boolean(BASE);
export const workspaceUrl = (slug, path = '/login') => (BASE ? `${window.location.protocol}//${slug}.${BASE}${window.location.port ? `:${window.location.port}` : ''}${path}` : `${path}?tenant=${slug}`);
