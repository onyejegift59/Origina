'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../login/login.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Unable to connect. Please try again.');
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.illustrationContainer}>
          <Image src="/images/origina-auth-illustration.png" alt="" fill sizes="100vw" priority className={styles.illustration} />
        </div>
        <div className={styles.overlay} />
        <div className={styles.formContainer}>
          <div className={styles.container}>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.subtitle}>
              If an account exists for <strong>{email}</strong>, we sent a password reset link.
            </p>
            <p className={styles.footer}>
              <Link href="/login" className={styles.link}>Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.illustrationContainer}>
        <Image src="/images/origina-auth-illustration.png" alt="" fill sizes="100vw" priority className={styles.illustration} />
      </div>
      <div className={styles.overlay} />
      <div className={styles.formContainer}>
        <div className={styles.container}>
          <h1 className={styles.title}>Reset password</h1>
          <p className={styles.subtitle}>Enter your email and we will send you a reset link.</p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
                autoComplete="email"
                aria-required="true"
              />
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <button type="submit" className={styles.button} disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className={styles.footer}>
            <Link href="/login" className={styles.link}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
