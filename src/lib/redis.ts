import { Redis } from '@upstash/redis';

const getOptionalEnv = (name: string): string | undefined => process.env[name]?.trim();

const redisConfig = {
  url: getOptionalEnv('UPSTASH_REDIS_REST_URL'),
  token: getOptionalEnv('UPSTASH_REDIS_REST_TOKEN'),
};

const redisClient: Redis | null = redisConfig.url && redisConfig.token ? new Redis(redisConfig) : null;

export const redis: Redis | null = redisClient;

export type NotificationPayload = Record<string, unknown>;

function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error(
      'Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment before enqueuing jobs.',
    );
  }

  return redisClient;
}

export async function enqueueProblemJob(problemId: string): Promise<number> {
  return getRedisClient().lpush('queue:problem-processing', problemId);
}

export async function checkRateLimit(
  userId: string,
  limit = 5,
  ttlSeconds = 60,
): Promise<boolean> {
  if (!redisClient) return true; // Fail open if redis is not configured
  const client = getRedisClient();
  const key = `ratelimit:submit:${userId}`;
  const current = (await client.get<number>(key)) ?? 0;

  if (current >= limit) {
    return false;
  }

  await client.set(key, current + 1, { ex: ttlSeconds });
  return true;
}

export async function checkChatRateLimit(
  userId: string,
  limit = 15,
  ttlSeconds = 60,
): Promise<boolean> {
  if (!redisClient) return true;
  try {
    const client = getRedisClient();
    const key = `ratelimit:chat:${userId}`;
    const current = (await client.get<number>(key)) ?? 0;

    if (current >= limit) {
      return false;
    }

    await client.set(key, current + 1, { ex: ttlSeconds });
    return true;
  } catch {
    return true;
  }
}

export async function publishNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<number | string> {
  return getRedisClient().publish(`pubsub:notifications:${userId}`, JSON.stringify(payload));
}
