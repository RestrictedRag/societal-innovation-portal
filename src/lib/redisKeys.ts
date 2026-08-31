export const redisKeys = {
  problemProcessingQueue: () => 'queue:problem-processing',
  rateLimitFor: (userId: string) => `ratelimit:submit:${userId}`,
  notificationsFor: (userId: string) => `pubsub:notifications:${userId}`,
};
