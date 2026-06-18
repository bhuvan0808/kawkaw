import { randomBytes } from 'crypto';

/** Converts arbitrary text to a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Slug with a short random suffix to avoid collisions. */
export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${randomBytes(3).toString('hex')}`;
}

/** Generates a human-readable order number, e.g. KK-G-7F3K9Q (prefix per service). */
export function generateOrderNumber(prefix = 'KK'): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}
