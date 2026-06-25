'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { EyeIcon, EyeOffIcon, Check, X } from 'lucide-react';
import formStyles from '../login/login.module.css';
import styles from './signup.module.css';
import { validateEmail, validatePassword, getPasswordStrength } from '@/lib/validation';

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'digit', label: 'One number', test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const router = useRouter();

  const emailError = useMemo(() => {
    if (!touched.email) return '';
    return validateEmail(email).message;
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!touched.password) return '';
    return validatePassword(password).message;
  }, [password, touched.password]);

  const confirmError = useMemo(() => {
    if (!touched.confirm) return '';
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  }, [confirmPassword, password, touched.confirm]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const allRulesMet = useMemo(() => PASSWORD_RULES.every((r) => r.test(password)), [password]);

  const valid = useMemo(() => {
    return validateEmail(email).valid && validatePassword(password).valid && password === confirmPassword;
  }, [email, password, confirmPassword]);

  const handleBlur = useCallback((field: 'email' | 'password' | 'confirm') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirm: true });
    if (!valid) return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setServerError(data.error.message);
        setLoading(false);
        return;
      }

      setSignedUp(true);
    } catch {
      setServerError('Unable to connect. Please try again.');
      setLoading(false);
    }
  };

  if (signedUp) {
    return (
      <div className={styles.page}>
        <div className={styles.illustrationContainer}>
          <Image src="/images/origina-auth-illustration.png" alt="" fill sizes="100vw" priority className={styles.illustration} />
        </div>
        <div className={styles.overlay} />
        <div className={styles.formContainer}>
          <div className={formStyles.container}>
            <h1 className={formStyles.title}>Check your email</h1>
            <p className={formStyles.subtitle}>
              We sent a confirmation link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
            <p className={formStyles.footer}>
              <Link href="/login" className={formStyles.link}>Sign in</Link>
            </p>
          </div>
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
        <div className={formStyles.container}>
          <h1 className={formStyles.title}>Create Account</h1>
          <p className={formStyles.subtitle}>Start building your product strategy</p>

          <form onSubmit={handleSubmit} className={formStyles.form} noValidate>
            <div className={formStyles.field}>
              <label htmlFor="email" className={formStyles.label}>Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`${formStyles.input} ${emailError ? formStyles.inputError : ''}`}
                autoComplete="email"
                aria-required="true"
                aria-invalid={emailError ? 'true' : undefined}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && (
                <p id="email-error" className={formStyles.fieldError} role="alert">{emailError}</p>
              )}
            </div>

            <div className={formStyles.field}>
              <label htmlFor="password" className={formStyles.label}>Password</label>
              <div className={formStyles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`${formStyles.input} ${formStyles.passwordInput} ${passwordError ? formStyles.inputError : ''}`}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={passwordError ? 'true' : undefined}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className={formStyles.eyeBtn}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className={formStyles.strengthBar} role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={3} aria-label={`Password strength: ${strength.label}`}>
                  <div
                    className={`${formStyles.strengthFill} ${formStyles[`strength${strength.label}`]}`}
                    style={{ width: `${(strength.score / 3) * 100}%` }}
                  />
                </div>
              )}

              <ul className={formStyles.passwordRules}>
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li key={rule.key} className={`${formStyles.passwordRule} ${met ? formStyles.passwordRuleMet : ''}`}>
                      {met ? <Check size={12} /> : <X size={12} />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>

              {passwordError && (
                <p id="password-error" className={formStyles.fieldError} role="alert">{passwordError}</p>
              )}
            </div>

            <div className={formStyles.field}>
              <label htmlFor="confirm-password" className={formStyles.label}>Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirm')}
                className={`${formStyles.input} ${confirmError ? formStyles.inputError : ''}`}
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={confirmError ? 'true' : undefined}
                aria-describedby={confirmError ? 'confirm-error' : undefined}
              />
              {confirmError && (
                <p id="confirm-error" className={formStyles.fieldError} role="alert">{confirmError}</p>
              )}
            </div>

            {serverError && <p className={formStyles.error} role="alert">{serverError}</p>}

            <button type="submit" className={formStyles.button} disabled={loading || !valid}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className={formStyles.footer}>
            Already have an account?{' '}
            <Link href="/login" className={formStyles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
