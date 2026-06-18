/* eslint-disable */
try { require('dotenv').config(); } catch {}
const jwt = require('jsonwebtoken');
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'kawkaw08';
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const a = jwt.sign({ iss: CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }, PRIVATE_KEY, { algorithm: 'RS256' });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: a }) });
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j)); return j.access_token;
}

(async () => {
  const tok = await token();
  const r = await fetch(`https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`, { headers: { Authorization: `Bearer ${tok}` } });
  const c = await r.json();
  console.log('HTTP', r.status);
  console.log('signIn.phoneNumber =', JSON.stringify(c.signIn?.phoneNumber, null, 2));
  console.log('smsRegionConfig =', JSON.stringify(c.smsRegionConfig, null, 2));
  console.log('authorizedDomains =', JSON.stringify(c.authorizedDomains));
})().catch((e) => { console.error(e.message); process.exit(1); });
