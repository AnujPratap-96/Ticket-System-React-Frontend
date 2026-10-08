import axios from 'axios';

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on any non-login call means the session expired or was revoked.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login')) {
      tokenStore.clear();
      onUnauthorized();
    }
    return Promise.reject(err);
  },
);

export const errorMessage = (err, fallback = 'Something went wrong') => {
  const data = err.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return data?.message || err.message || fallback;
};

export default api;
