import axios from 'axios';
import { clearTenant, getTenant } from '../lib/tenant';

const TOKEN_KEY = 'deskflow_token';

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set: (t) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage unavailable */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
  },
};

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Which workspace? (a signed-in person's token already decides it on the server; this is for sign-in and public pages)
  const tenant = getTenant();
  if (tenant && !/^\/(platform|workspaces)/.test(config.url || '')) config.headers['X-Tenant'] = tenant;
  return config;
});

const NO_WORKSPACE_PAGES = /^\/(workspace|start|platform)/;

// A 401 on any non-login call means the session expired or was revoked.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    // The server cannot tell which workspace this is: ask the person.
    const code = err.response?.data?.code;
    if ((code === 'workspace_required' || code === 'workspace_not_found') && !NO_WORKSPACE_PAGES.test(window.location.pathname)) {
      if (code === 'workspace_not_found') clearTenant();
      window.location.assign('/workspace');
    }
    if (err.response?.status === 401 && !url.includes('/auth/login') && !url.includes('/platform/login')) {
      tokenStore.clear();
      onUnauthorized(url);
    }
    return Promise.reject(err);
  },
);

export const errorMessage = (err, fallback = 'Something went wrong') => {
  const data = err.response?.data;
  // The server's own wording wins for a locked account or a plan limit; a bare 429 is the rate limiter.
  if (err.response?.status === 429 && !['account_locked', 'quota_exceeded'].includes(data?.code)) return 'You are doing that too quickly. Please wait a minute and try again.';
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || err.message || fallback;
};

export default api;
