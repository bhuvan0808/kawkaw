/* eslint-disable */
/**
 * Finishes Firebase phone-auth setup using the backend service account:
 *  - enables the Phone sign-in provider + adds a TEST number (no real SMS),
 *  - ensures a debug keystore exists and registers its SHA-1/SHA-256 on the app.
 *
 * Run from services/api:  node scripts/firebase-auth-setup.js
 */
try { require('dotenv').config(); } catch {}
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const jwt = require('jsonwebtoken');

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'kawkaw08';
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const PACKAGE = process.env.ANDROID_PACKAGE || 'in.kawkaw.kawkaw_customer';
const TEST_NUMBER = process.env.TEST_PHONE || '+919000000001';
const TEST_CODE = process.env.TEST_CODE || '123456';

function keytoolPath() {
  const jbr = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe');
  return fs.existsSync(jbr) ? jbr : 'keytool';
}

function ensureDebugKeystoreAndSha() {
  const ks = path.join(os.homedir(), '.android', 'debug.keystore');
  const kt = keytoolPath();
  if (!fs.existsSync(ks)) {
    fs.mkdirSync(path.dirname(ks), { recursive: true });
    console.log('Creating debug keystore...');
    execFileSync(kt, [
      '-genkeypair', '-alias', 'androiddebugkey', '-keyalg', 'RSA', '-keysize', '2048',
      '-validity', '10000', '-keystore', ks, '-storepass', 'android', '-keypass', 'android',
      '-dname', 'CN=Android Debug,O=Android,C=US',
    ]);
  }
  const out = execFileSync(kt, ['-list', '-v', '-alias', 'androiddebugkey', '-keystore', ks, '-storepass', 'android'], { encoding: 'utf8' });
  const sha1 = (out.match(/SHA1:\s*([0-9A-F:]+)/i) || [])[1];
  const sha256 = (out.match(/SHA-?256:\s*([0-9A-F:]+)/i) || [])[1];
  return {
    sha1: sha1 ? sha1.replace(/:/g, '').toLowerCase() : null,
    sha256: sha256 ? sha256.replace(/:/g, '').toLowerCase() : null,
  };
}

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: CLIENT_EMAIL, scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 },
    PRIVATE_KEY, { algorithm: 'RS256' },
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token failed (${res.status}): ${JSON.stringify(json)}`);
  return json.access_token;
}

async function req(tok, method, url, body) {
  const res = await fetch(url, {
    method, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) throw new Error('FIREBASE_CLIENT_EMAIL/PRIVATE_KEY missing');
  const tok = await token();
  const mgmt = `https://firebase.googleapis.com/v1beta1/projects/${PROJECT}`;

  // 0) Ensure the Auth config exists (provision Identity Platform). Idempotent-ish.
  const initUrl = `https://identitytoolkit.googleapis.com/v2/projects/${PROJECT}/identityPlatform:initializeAuth`;
  const init = await req(tok, 'POST', initUrl, {});
  if (init.ok) console.log('✓ Initialized Authentication (Identity Platform) config');
  else console.log(`(initializeAuth -> ${init.status}: ${JSON.stringify(init.json).slice(0, 160)})`);

  // 1) Enable Phone provider + test number (Identity Toolkit Admin API).
  //    MERGE with any existing test numbers so adding the rider number does not
  //    wipe the customer/super-admin number (the config is project-wide).
  const adminCfgUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`;
  let existingTestNumbers = {};
  const current = await req(tok, 'GET', adminCfgUrl);
  if (current.ok) {
    existingTestNumbers = (current.json.signIn && current.json.signIn.phoneNumber && current.json.signIn.phoneNumber.testPhoneNumbers) || {};
  }
  const mergedTestNumbers = { ...existingTestNumbers, [TEST_NUMBER]: TEST_CODE };
  const cfgUrl = `${adminCfgUrl}?updateMask=signIn.phoneNumber.enabled,signIn.phoneNumber.testPhoneNumbers`;
  const cfgBody = { signIn: { phoneNumber: { enabled: true, testPhoneNumbers: mergedTestNumbers } } };
  let cfg = await req(tok, 'PATCH', cfgUrl, cfgBody);
  if (!cfg.ok && cfg.status === 404) {
    await new Promise((r) => setTimeout(r, 3000));
    cfg = await req(tok, 'PATCH', cfgUrl, cfgBody);
  }
  if (cfg.ok) {
    console.log(`✓ Phone auth enabled; test numbers: ${Object.keys(mergedTestNumbers).join(', ')} (added ${TEST_NUMBER} -> ${TEST_CODE})`);
  } else {
    console.warn(`! Could not enable phone auth via API (${cfg.status}). Enable it in the console: Authentication → Sign-in method → Phone. Detail: ${JSON.stringify(cfg.json).slice(0, 300)}`);
  }

  // 1b) Allow SMS to India (default is an empty allowlist = all regions blocked).
  const smsUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config?updateMask=smsRegionConfig`;
  const sms = await req(tok, 'PATCH', smsUrl, { smsRegionConfig: { allowlistOnly: { allowedRegions: ['IN'] } } });
  console.log(sms.ok ? '✓ SMS region allowlist set to [IN]' : `! SMS region update failed (${sms.status}): ${JSON.stringify(sms.json).slice(0, 200)}`);

  // 2) Register the debug SHA-1/256 on the Android app.
  const list = await req(tok, 'GET', `${mgmt}/androidApps`);
  const app = (list.json.apps || []).find((a) => a.packageName === PACKAGE);
  if (!app) throw new Error(`Android app ${PACKAGE} not found — run firebase-autoconfig.js first.`);

  let shas;
  try {
    shas = ensureDebugKeystoreAndSha();
  } catch (e) {
    console.warn(`! Could not compute debug SHA (${e.message}). Add it manually later.`);
    shas = { sha1: null, sha256: null };
  }

  const existing = await req(tok, 'GET', `${mgmt}/androidApps/${app.appId}/sha`);
  const have = new Set((existing.json.certificates || []).map((c) => (c.shaHash || '').toLowerCase()));

  for (const [hash, type] of [[shas.sha1, 'SHA_1'], [shas.sha256, 'SHA_256']]) {
    if (!hash) continue;
    if (have.has(hash)) { console.log(`✓ ${type} already registered`); continue; }
    const r = await req(tok, 'POST', `${mgmt}/androidApps/${app.appId}/sha`, { shaHash: hash, certType: type });
    console.log(r.ok ? `✓ Registered debug ${type}` : `! Failed to register ${type} (${r.status}): ${JSON.stringify(r.json).slice(0, 200)}`);
  }

  console.log('\nDone. You can now log in with the test number above (no real SMS).');
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});
