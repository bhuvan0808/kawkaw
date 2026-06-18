'use client';

import { Icon } from '@/components/layout/icons';
import { Button, Input, Label, Spinner } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/env';
import { firebaseAuth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { ready, isAuthenticated, isStaff, loginWithIdToken, logout } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);

  // Already signed in → go to the console.
  useEffect(() => {
    if (ready && isAuthenticated && isStaff) router.replace('/');
  }, [ready, isAuthenticated, isStaff, router]);

  function getVerifier(): RecaptchaVerifier {
    if (!verifier.current) {
      verifier.current = new RecaptchaVerifier(firebaseAuth(), 'recaptcha-container', { size: 'invisible' });
    }
    return verifier.current;
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      const e164 = `+91${digits.slice(-10)}`;
      confirmation.current = await signInWithPhoneNumber(firebaseAuth(), e164, getVerifier());
      setStep('otp');
    } catch (err) {
      setError((err as Error).message || 'Could not send the code. Try again.');
      verifier.current?.clear();
      verifier.current = null;
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmation.current) return;
    setBusy(true);
    try {
      const cred = await confirmation.current.confirm(otp.trim());
      const idToken = await cred.user.getIdToken();
      const user = await loginWithIdToken(idToken);
      const staff = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(user.role);
      if (!staff) {
        await logout();
        setError('This account does not have admin access.');
        setStep('phone');
        return;
      }
      toast.success(`Welcome, ${user.name ?? user.phone}`);
      router.replace('/');
    } catch (err) {
      setError((err as Error).message || 'Invalid code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <div id="recaptcha-container" />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-ink">
            <Icon name="box" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Kaw Kaw Admin</h1>
            <p className="text-xs text-ink-muted">Operations console</p>
          </div>
        </div>

        {!isFirebaseConfigured && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Firebase web config is missing. Set the <code>NEXT_PUBLIC_FIREBASE_*</code> env vars.
          </p>
        )}

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <Label htmlFor="phone">Mobile number</Label>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-surface-border bg-surface-subtle px-3 py-2 text-sm text-ink-soft">
                  +91
                </span>
                <Input
                  id="phone"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-sm text-status-danger">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">
              Send code
            </Button>
            <p className="text-center text-xs text-ink-muted">Admins sign in with their registered phone number.</p>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <Label htmlFor="otp">Enter the 6-digit code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />
              <p className="mt-1 text-xs text-ink-muted">Sent to +91 {phone.replace(/\D/g, '').slice(-10)}</p>
            </div>
            {error && <p className="text-sm text-status-danger">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">
              Verify &amp; sign in
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs text-ink-muted hover:text-ink"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError(null);
              }}
            >
              Change number
            </button>
          </form>
        )}

        {!ready && (
          <div className="mt-4 flex justify-center text-ink-muted">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
