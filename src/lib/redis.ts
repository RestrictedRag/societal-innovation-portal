import { Redis } from '@upstash/redis';

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const redis = new Redis({
  url: getRequiredEnv('UPSTASH_REDIS_REST_URL'),
  token: getRequiredEnv('UPSTASH_REDIS_REST_TOKEN'),
});

export type NotificationPayload = Record<string, unknown>;

export async function enqueueProblemJob(problemId: string): Promise<number> {
  return redis.lpush('queue:problem-processing', problemId);
}

export async function checkRateLimit(
  userId: string,
  limit = 5,
  ttlSeconds = 60,
): Promise<boolean> {
  const key = `ratelimit:submit:${userId}`;
  const current = (await redis.get<number>(key)) ?? 0;

  if (current >= limit) {
    return false;
  }

  await redis.set(key, current + 1, { ex: ttlSeconds });
  return true;
}

export async function publishNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<number | string> {
  return redis.publish(`pubsub:notifications:${userId}`, JSON.stringify(payload));
}
