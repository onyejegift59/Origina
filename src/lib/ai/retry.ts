const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

function isRetryable(error: Error): boolean {
  const msg = error.message;
  if (msg.includes('400') || msg.includes('401') || msg.includes('422')) return false;
  return true;
}

function jitter(delay: number): number {
  return delay + Math.random() * delay * 0.3;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries && isRetryable(lastError)) {
        const delay = jitter(BASE_DELAY * Math.pow(2, attempt));
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (!isRetryable(lastError)) {
        break;
      }
    }
  }

  throw lastError;
}
