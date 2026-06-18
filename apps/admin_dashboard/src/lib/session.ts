'use client';

import type { SessionUser } from './types';

const STORAGE_KEY = 'kawkaw.admin.session';

export interface Session {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  /** epoch ms when the access token expires */
  expiresAt: number;
}

type Listener = (session: Session | null) => void;

let current: Session | null = null;
const listeners = new Set<Listener>();

/** Load any persisted session from localStorage (call once on the client). */
export function loadSession(): Session | null {
  if (typeof window === 'undefined') return null;
  if (current) return current;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) current = JSON.parse(raw) as Session;
  } catch {
    current = null;
  }
  return current;
}

export function getSession(): Session | null {
  return current ?? loadSession();
}

export function setSession(session: Session): void {
  current = session;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
  listeners.forEach((l) => l(session));
}

/** Update only the token triplet (used after a silent refresh). */
export function setTokens(tokens: { accessToken: string; refreshToken: string; expiresIn: number }): void {
  const existing = getSession();
  if (!existing) return;
  setSession({
    ...existing,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + tokens.expiresIn * 1000,
  });
}

export function clearSession(): void {
  current = null;
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((l) => l(null));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
