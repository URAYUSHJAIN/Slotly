/**
 * useAuth — single source of truth for "who is signed in".
 *
 * Public API (do not change without checking Navbar / AppointmentsPage):
 *   status   'loading' | 'authed' | 'anon'
 *   user     Neon Auth user (id, email, name) or null
 *   profile  Slotly profile row (incl. role) or null
 *   role     'patient' | 'doctor' | null
 *   signOut  () => Promise<void>
 *   refresh  () => Promise<void>   re-read session + profile
 *
 * Mutations (signUp / signIn) live in authActions.js — call those from
 * components, then call refresh() to update this context.
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authClient } from './auth.js';
import { fetchMyProfile } from './neonApi.js';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus]   = useState('loading');

  const refresh = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      const sessionUser = session?.data?.user ?? null;

      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setStatus('anon');
        return;
      }

      setUser(sessionUser);

      let profileRow = null;
      try {
        profileRow = await fetchMyProfile();
      } catch (err) {
        console.warn('[Slotly] fetchMyProfile failed during refresh:', err);
      }

      setProfile(profileRow);
      setStatus('authed');
    } catch (err) {
      console.error('[Slotly] auth refresh failed:', err);
      setUser(null);
      setProfile(null);
      setStatus('anon');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn('[Slotly] signOut error (ignored):', err);
    }
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
    refresh,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
