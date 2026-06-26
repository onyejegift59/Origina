'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validatePassword, getPasswordStrength } from '@/lib/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY') {
        router.push('/login');
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
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  const strength = getPasswordStrength(password);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Reset your password</h1>
        <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '24px' }}>
          Enter your new password below.
        </p>

        {success ? (
          <div style={{ padding: '16px', background: 'var(--primary-container)', borderRadius: '8px', color: 'var(--on-primary-container)' }}>
            Password updated successfully. Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                New password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--outline)', borderRadius: '8px', fontSize: '14px', background: 'var(--surface)', color: 'var(--on-surface)' }}
                required
                minLength={8}
              />
              {password && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: strength.score >= 3 ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                  Strength: {strength.label}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="confirm-password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--outline)', borderRadius: '8px', fontSize: '14px', background: 'var(--surface)', color: 'var(--on-surface)' }}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'var(--error-container)', borderRadius: '8px', color: 'var(--on-error-container)', fontSize: '14px', marginBottom: '16px' }} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'var(--on-primary)', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Updating...' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
