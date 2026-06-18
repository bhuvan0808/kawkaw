/* eslint-disable */
/**
 * Adds domain(s) to the Firebase Auth "authorized domains" allow-list (required
 * for web phone-auth / reCAPTCHA on the admin dashboard). Uses the backend
 * service account — no `firebase login`.
 *
 * Run from services/api:  node scripts/firebase-add-domain.js <domain> [<domain> ...]
 */
try { require('dotenv').config(); } catch {}
const jwt = require('jsonwebtoken');

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'kawkaw08';
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const domains = process.argv.slice(2).filter(Boolean);

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    PRIVATE_KEY,
    { algorithm: 'RS256' },
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`token failed (${res.status}): ${JSON.stringify(j)}`);
  return j.access_token;
}

async function main() {
  if (!domains.length) throw new Error('Usage: node scripts/firebase-add-domain.js <domain> ...');
  if (!CLIENT_EMAIL || !PRIVATE_KEY) throw new Error('FIREBASE_CLIENT_EMAIL/PRIVATE_KEY missing');
  const tok = await token();
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`;
  const headers = { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' };

  const current = await (await fetch(url, { headers })).json();
  const existing = current.authorizedDomains || [];
  const merged = Array.from(new Set([...existing, ...domains]));
  const res = await fetch(`${url}?updateMask=authorizedDomains`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ authorizedDomains: merged }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`PATCH failed (${res.status}): ${JSON.stringify(j).slice(0, 300)}`);
  console.log('✓ Authorized domains:', j.authorizedDomains.join(', '));
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
