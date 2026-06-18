import * as Sentry from '@sentry/node';

let enabled = false;

/**
 * Initialise Sentry error monitoring. No-op when SENTRY_DSN is unset, so local
 * dev / CI / tests run without it. Call once at the very start of bootstrap.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Light tracing; bump later if you want performance data.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });
  enabled = true;
}

export function sentryEnabled(): boolean {
  return enabled;
}

/** Report an unhandled/5xx error. Safe to call when Sentry is disabled. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!enabled) return;
  if (context) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }
}
