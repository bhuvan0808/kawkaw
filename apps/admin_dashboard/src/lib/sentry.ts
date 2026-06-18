'use client';

import * as Sentry from '@sentry/react';

let initialized = false;

/** Initialise browser error monitoring. No-op without NEXT_PUBLIC_SENTRY_DSN. */
export function initSentry(): void {
  if (initialized) return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'production',
    tracesSampleRate: 0.1,
    // Don't capture during local dev unless explicitly enabled.
    enabled: process.env.NODE_ENV === 'production',
  });
  initialized = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
