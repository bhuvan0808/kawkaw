'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { env } from './env';

let app: FirebaseApp | undefined;

export function firebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(env.firebase);
  }
  return app;
}

export function firebaseAuth(): Auth {
  const auth = getAuth(firebaseApp());
  // Test mode lets a configured Firebase test number sign in without a real SMS
  // (and without solving reCAPTCHA). Guarded to dev only via the env flag.
  if (env.firebaseTestMode) {
    auth.settings.appVerificationDisabledForTesting = true;
  }
  return auth;
}
