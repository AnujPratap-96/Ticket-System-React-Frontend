import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { stopRealtime } from '../lib/realtime';
import api, { setUnauthorizedHandler, tokenStore } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [booting, setBooting] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const clear = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setPermissions({});
    setTwoFactorEnabled(false);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clear();
      toast.error('Please sign in again to continue.', 'Your session expired');
    });
  }, [clear, toast]);

  // Restore the session from the stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.get()) {
        setBooting(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (!cancelled) {
          setUser(res.data.user);
          setPermissions(res.data.permissions || {});
          setTwoFactorEnabled(!!res.data.two_factor_enabled);
        }
      } catch {
        if (!cancelled) clear();
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clear]);

  const finish = useCallback(async (token, { silent = false } = {}) => {
    tokenStore.set(token);
    const me = await api.get('/auth/me');
    setUser(me.data.user);
    setPermissions(me.data.permissions || {});
    setTwoFactorEnabled(!!me.data.two_factor_enabled);
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
  }, []);

  // After a profile change the API returns the fresh user: show it everywhere at once.
  const updateUser = useCallback((u) => setUser(u), []);

  // Used after OTP verification, which returns a token directly.
  const completeLogin = useCallback((token) => finish(token, { silent: true }), [finish]);

  const logout = useCallback(async () => {
    stopRealtime();
    try {
      await api.post('/auth/logout');
    } catch {
      // token may already be invalid; local cleanup below is what matters
    }
    clear();
    toast.info('You have been signed out.', 'Signed out');
  }, [clear, toast]);

  const value = useMemo(
    () => ({ user, permissions, booting, twoFactorEnabled, login, submitTwoFactor, refreshMe, updateUser, completeLogin, logout, isStaff: !!user && user.role !== 'customer' }),
    [user, permissions, booting, twoFactorEnabled, login, submitTwoFactor, refreshMe, updateUser, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
