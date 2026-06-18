'use client';

import { UserRole } from '@kawkaw/shared-types';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api-client';
import { clearSession, getSession, loadSession, setSession, subscribe, type Session } from './session';
import type { SessionUser } from './types';

/** Roles allowed to use the admin console at all. */
export const STAFF_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPPORT];

interface FirebaseLoginResponse {
  user: SessionUser;
  tokens: { accessToken: string; refreshToken: string; expiresIn: number };
}

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  user: SessionUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  loginWithIdToken: (idToken: string, name?: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSessionState(loadSession());
    setReady(true);
    return subscribe(setSessionState);
  }, []);

  const loginWithIdToken = useCallback(async (idToken: string, name?: string) => {
    const res = await api.post<FirebaseLoginResponse>('/auth/firebase', { idToken, name });
    const next: Session = {
      user: res.user,
      accessToken: res.tokens.accessToken,
      refreshToken: res.tokens.refreshToken,
      expiresAt: Date.now() + res.tokens.expiresIn * 1000,
    };
    setSession(next);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    const s = getSession();
    if (s?.refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken: s.refreshToken });
      } catch {
        /* best effort */
      }
    }
    clearSession();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = session?.user.role ?? null;
    return {
      ready,
      session,
      user: session?.user ?? null,
      role,
      isAuthenticated: Boolean(session),
      isStaff: role ? STAFF_ROLES.includes(role) : false,
      hasRole: (...roles: UserRole[]) => (role ? roles.includes(role) : false),
      loginWithIdToken,
      logout,
    };
  }, [session, ready, loginWithIdToken, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
