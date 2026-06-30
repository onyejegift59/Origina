'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validateEmail } from '@/lib/validation';
import styles from './login.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Email verification failed. Please try signing up again.',
  link_expired: 'This password reset link has expired. Please request a new one.',
};

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [touched, setTouched] = useState({ email: false, password: false });
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get('next') ?? '/dashboard';
  const callbackError = searchParams.get('error');

  const emailError = useMemo(() => {
    if (!touched.email) return '';
    return validateEmail(email).message;
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return '';
    if (!password) return 'Password is required';
    return '';
  }, [password, touched.password]);

  const handleBlur = useCallback((field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  useEffect(() => {
    if (callbackError) {
      setError(ERROR_MESSAGES[callbackError] || 'Authentication failed. Please try again.');
    }
  }, [callbackError]);

  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push(next);
      } else {
        setCheckingSession(false);
      }
    };
    check();
  }, [router, next]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (emailError || passwordError) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error.message);
        setLoading(false);
        return;
      }

      router.push(next);
    } catch {
      setError('Unable to connect. Please try again.');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className={styles.page} role="status" aria-label="Checking session">
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.illustrationContainer}>
        <Image
          src="/images/origina-auth-illustration.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className={styles.illustration}
        />
      </div>
      <div className={styles.overlay} />
      <div className={styles.formContainer}>
        <div className={styles.container}>
          <h1 className={styles.title}>Origina</h1>
          <p className={styles.subtitle}>Product Planning Workspace</p>

          <form onSubmit={handleLogin} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={emailError ? 'true' : undefined}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className={styles.fieldError} role="alert">{emailError}</p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`${styles.input} ${styles.passwordInput} ${passwordError ? styles.inputError : ''}`}
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={passwordError ? 'true' : undefined}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className={styles.fieldError} role="alert">{passwordError}</p>
              )}
            </div>

            <div className={styles.forgotRow}>
              <Link href="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
            </div>

            {error && (
              <p id="login-error" className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={styles.footer}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className={styles.link}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.page} role="status" aria-label="Loading">
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner} />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
