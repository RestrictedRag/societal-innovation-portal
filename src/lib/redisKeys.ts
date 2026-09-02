export const redisKeys = {
  problemProcessingQueue: () => 'queue:problem-processing',
  deadLetterQueue: () => 'queue:problem-processing:dead',
  retryCountFor: (problemId: string) => `retry:count:${problemId}`,
  rateLimitFor: (userId: string) => `ratelimit:submit:${userId}`,
  rateLimitChatFor: (userId: string) => `ratelimit:chat:${userId}`,
  notificationsFor: (userId: string) => `pubsub:notifications:${userId}`,
};

