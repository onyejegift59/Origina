export interface ValidationResult {
  valid: boolean;
  message: string;
}

export interface PasswordStrength {
  score: number;
  label: 'None' | 'Weak' | 'Medium' | 'Strong';
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'At least 1 uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'At least 1 lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'At least 1 number' },
];

export function validateEmail(email: string): ValidationResult {
  if (!email) return { valid: false, message: 'Email is required.' };
  if (!emailRegex.test(email)) return { valid: false, message: 'Enter a valid email address.' };
  return { valid: true, message: '' };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, message: 'Password is required.' };
  const failed = passwordRules.find((rule) => !rule.test(password));
  if (failed) return { valid: false, message: failed.label };
  return { valid: true, message: '' };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const passed = passwordRules.filter((rule) => rule.test(password)).length;
  if (passed === 0) return { score: 0, label: 'None' };
  if (passed <= 2) return { score: 1, label: 'Weak' };
  if (passed === 3) return { score: 2, label: 'Medium' };
  return { score: 3, label: 'Strong' };
}

export function isFormValid(email: string, password: string): boolean {
  return validateEmail(email).valid && validatePassword(password).valid;
}


