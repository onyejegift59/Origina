import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const FALLBACK_LIMIT = { allowed: false, remaining: 0, reset: 0 };

export function createRatelimit(requestsPerHour: number) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('[ratelimit] Redis not configured — applying conservative rate limits');
    return null;
  }

  return new Ratelimit({
    redis: new Redis({ url: redisUrl, token: redisToken }),
    limiter: Ratelimit.slidingWindow(requestsPerHour, '1 h'),
    analytics: true,
  });
}

export async function checkRateLimit(
  identifier: string,
  requestsPerHour: number
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const ratelimit = createRatelimit(requestsPerHour);

  if (!ratelimit) {
    return FALLBACK_LIMIT;
  }

  const { success, remaining, reset } = await ratelimit.limit(identifier);
  return { allowed: success, remaining, reset };
}
