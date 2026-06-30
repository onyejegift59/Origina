'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validatePassword, getPasswordStrength } from '@/lib/validation';
import styles from '../login/login.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await fetch('/api/auth/clear-reset-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id }),
      });
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  const strength = getPasswordStrength(password);

  if (!ready) return null;

  return (
    <div className={styles.page}>
      <div className={styles.illustrationContainer}>
        <Image src="/images/origina-auth-illustration.png" alt="" fill sizes="100vw" priority className={styles.illustration} />
      </div>
      <div className={styles.overlay} />
      <div className={styles.formContainer}>
        <div className={styles.container}>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.subtitle}>Enter your new password below.</p>

          {success ? (
            <div className={styles.successBanner}>
              Password updated successfully. Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>New password</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${styles.input} ${styles.passwordInput}`}
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                {password && (
                  <div className={styles.strengthBar} role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={3} aria-label={`Password strength: ${strength.label}`}>
                    <div
                      className={`${styles.strengthFill} ${styles[`strength${strength.label}`]}`}
                      style={{ width: `${(strength.score / 3) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {password.length > 0 && (
                <div className={styles.field}>
                  <label htmlFor="confirm-password" className={styles.label}>Confirm new password</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`${styles.input} ${styles.passwordInput}`}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowConfirm((prev) => !prev)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              )}

              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? 'Updating...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
