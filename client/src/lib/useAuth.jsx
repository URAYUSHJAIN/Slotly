/**
 * useAuth — single source of truth for "who is signed in".
 *
 * Exposes:
 *   status   'loading' | 'authed' | 'anon'
 *   user     Neon Auth user (id, email, name) or null
 *   profile  Slotly profile row (incl. role) or null
 *   role     'patient' | 'doctor' | null
 *   signOut  () => Promise<void>
 *   refresh  () => Promise<void>   (re-fetch profile after signup)
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authClient } from './auth.js';
import { fetchMyProfile } from './neonApi.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus]   = useState('loading');

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchMyProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      const u = session?.data?.user ?? null;
      if (u) {
        setUser(u);
        await loadProfile();
        setStatus('authed');
      } else {
        setUser(null);
        setProfile(null);
        setStatus('anon');
      }
    } catch {
      setUser(null);
      setProfile(null);
      setStatus('anon');
    }
  }, [loadProfile]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signOut = useCallback(async () => {
    try { await authClient.signOut(); } catch { /* ignore */ }
    setUser(null);
    setProfile(null);
    setStatus('anon');
  }, []);

  const value = {
    status,
    user,
    profile,
    role: profile?.role ?? null,
    signOut,
    refresh: bootstrap,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
