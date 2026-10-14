import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { stopRealtime } from '../lib/realtime';
import api, { setUnauthorizedHandler, tokenStore } from '../api/client';
import { useToast } from './ToastContext';
import { applyBrandColor } from '../lib/brand';

const AuthContext = createContext(null);

/** A workspace person, or (when /auth/me says so) the platform owner. */
async function fetchMe() {
  try {
    return (await api.get('/auth/me')).data;
  } catch (err) {
    if (err.response?.data?.code === 'platform_account') return { ...(await api.get('/platform/me')).data, permissions: {} };
    throw err;
  }
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [booting, setBooting] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false); // the workspace demands 2FA and this person has none yet
  const bootingRef = useRef(true);

  useEffect(() => { applyBrandColor(user?.tenant?.brand_color); }, [user?.tenant?.brand_color]);

  const clear = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setPermissions({});
    setTwoFactorEnabled(false);
    setTwoFactorRequired(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((url) => {
      clear();
      if (!bootingRef.current && (!url || !url.includes('/auth/me'))) {
        toast.error('Please sign in again to continue.', 'Your session expired');
      }
    });
  }, [clear, toast, user]);

  // Restore the session from the stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.get()) {
        bootingRef.current = false;
        setBooting(false);
        return;
      }
      try {
        const data = await fetchMe();
        if (!cancelled) {
          setUser(data.user);
          setPermissions(data.permissions || {});
          setTwoFactorEnabled(!!data.two_factor_enabled);
          setTwoFactorRequired(!!data.two_factor_setup_required);
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        bootingRef.current = false;
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clear]);

  const finish = useCallback(async (token, { silent = false } = {}) => {
    tokenStore.set(token);
    const me = { data: await fetchMe() };
    setUser(me.data.user);
    setPermissions(me.data.permissions || {});
    setTwoFactorEnabled(!!me.data.two_factor_enabled);
    setTwoFactorRequired(!!me.data.two_factor_setup_required);
    if (!silent) toast.success(`Signed in as ${me.data.user.name}.`, 'Welcome back');
  }, [toast]);

  // Returns { challenge } when a second factor is required, otherwise signs in.
  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.two_factor_required) return { challenge: res.data.challenge };
    await finish(res.data.token);
    return {};
  }, [finish]);

  const submitTwoFactor = useCallback(async (challenge, code) => {
    const res = await api.post('/auth/two-factor-challenge', { challenge, code });
    await finish(res.data.token);
  }, [finish]);

  const refreshMe = useCallback(async () => {
    const me = await api.get('/auth/me');
    setUser(me.data.user);
    setPermissions(me.data.permissions || {});
    setTwoFactorEnabled(!!me.data.two_factor_enabled);
    setTwoFactorRequired(!!me.data.two_factor_setup_required);
  }, []);

  // After a profile change the API returns the fresh user: show it everywhere at once.
  const updateUser = useCallback((u) => setUser(u), []);

  // Used after OTP verification, which returns a token directly.
  const completeLogin = useCallback((token) => finish(token, { silent: true }), [finish]);

  const logout = useCallback(async () => {
    stopRealtime();
    // Sign out locally first, so leaving the page mid-request can never keep someone signed in; then revoke the token server-side.
    const token = tokenStore.get();
    const url = user?.role === 'super_admin' ? '/platform/logout' : '/auth/logout';
    clear();
    toast.info('You have been signed out.', 'Signed out');
    try {
      await api.post(url, null, { headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // token may already be invalid; local cleanup above is what matters
    }
  }, [clear, toast, user]);

  const value = useMemo(
    () => ({ user, permissions, booting, twoFactorEnabled, twoFactorRequired, login, submitTwoFactor, refreshMe, updateUser, completeLogin, logout, isStaff: !!user && user.role !== 'customer' }),
    [user, permissions, booting, twoFactorEnabled, twoFactorRequired, login, submitTwoFactor, refreshMe, updateUser, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
