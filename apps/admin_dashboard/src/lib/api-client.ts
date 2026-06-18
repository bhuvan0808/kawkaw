'use client';

import type { Paginated } from '@kawkaw/shared-types';
import { env } from './env';
import { clearSession, getSession, setTokens } from './session';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${env.apiBaseUrl}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

let refreshing: Promise<boolean> | null = null;

/** Rotate the refresh token once; concurrent callers share the same attempt. */
async function refreshTokens(): Promise<boolean> {
  if (refreshing) return refreshing;
  const session = getSession();
  if (!session?.refreshToken) return false;
  refreshing = (async () => {
    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
      if (!res.ok) return false;
      const body = await res.json();
      const data = body?.data ?? body;
      if (!data?.accessToken) return false;
      setTokens(data);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** raw body (FormData) — skips JSON encoding */
  formData?: FormData;
  signal?: AbortSignal;
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}, retry = true): Promise<T> {
  const session = getSession();
  const headers: Record<string, string> = {};
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(buildUrl(path, opts.query), { method, headers, body, signal: opts.signal });

  if (res.status === 401 && retry && session?.refreshToken) {
    const ok = await refreshTokens();
    if (ok) return request<T>(method, path, opts, false);
    clearSession();
    throw new ApiError(401, 'Your session expired. Please sign in again.');
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const p = payload as { message?: string; errorCode?: string; details?: unknown } | null;
    throw new ApiError(res.status, p?.message || `Request failed (${res.status})`, p?.errorCode, p?.details);
  }

  // Unwrap the { success, data, timestamp } envelope.
  const envelope = payload as { data?: T } | null;
  return (envelope && typeof envelope === 'object' && 'data' in envelope ? envelope.data : payload) as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  list: <T>(path: string, query?: Query, signal?: AbortSignal) => request<Paginated<T>>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, formData: FormData) => request<T>('POST', path, { formData }),
};

/** Fetch a protected binary (e.g. a prescription image) as an object URL. */
export async function fetchBlobUrl(path: string): Promise<string> {
  const session = getSession();
  const res = await fetch(buildUrl(path), {
    headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, 'Could not load file');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
