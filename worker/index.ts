import http from 'node:http';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { citizenProblems } from '@/db/schema';
import { warmEmbeddingModel } from '@/lib/ai/embeddings';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { redisKeys } from '@/lib/redisKeys';
import { processProblemJob } from './pipeline';

const PORT = Number(process.env.PORT || 8080);
const MAX_RETRIES = 3;
const POLL_INTERVAL_EMPTY_MS = 1000;

let isShuttingDown = false;
let isJobInFlight = false;
let lastSuccessfulJobAt: string | null = null;
let totalJobsProcessed = 0;
let totalJobsFailed = 0;

/**
 * Minimal Health Check Server for platform uptime monitoring (Railway, Fly, Render, etc.)
 */
const server = http.createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    const healthData = {
      status: isShuttingDown ? 'shutting_down' : 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      isJobInFlight,
      totalJobsProcessed,
      totalJobsFailed,
      lastSuccessfulJobAt,
      timestamp: new Date().toISOString(),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

/**
 * Get current retry count for a problem from Redis
 */
async function getRetryCount(problemId: string): Promise<number> {
  if (!redis) return 0;
  try {
    const key = redisKeys.retryCountFor(problemId);
    const count = await redis.get<number>(key);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Increment retry count in Redis with TTL of 1 hour
 */
async function incrementRetryCount(problemId: string): Promise<number> {
  if (!redis) return 1;
  try {
    const key = redisKeys.retryCountFor(problemId);
    const newCount = (await redis.incr(key)) || 1;
    await redis.expire(key, 3600);
    return newCount;
  } catch {
    return 1;
  }
}

/**
 * Move failing problem to dead-letter queue and mark status as PROCESSING_FAILED
 */
async function moveToDeadLetter(problemId: string, errorReason: string) {
  logger.error('CRITICAL: Problem exceeded max retries, moving to dead-letter queue', {
    problemId,
    error: errorReason,
    deadLetterQueue: redisKeys.deadLetterQueue(),
  });

  try {
    if (redis) {
      await redis.lpush(redisKeys.deadLetterQueue(), JSON.stringify({
        problemId,
        error: errorReason,
        failedAt: new Date().toISOString(),
      }));
    }

    await db
      .update(citizenProblems)
      .set({ status: 'PROCESSING_FAILED' })
      .where(eq(citizenProblems.id, problemId));

    totalJobsFailed++;
  } catch (err) {
    logger.error('Failed to update problem to dead-letter state', {
      problemId,
      error: String(err),
    });
  }
}

/**
 * Requeue job with exponential backoff delay
 */
async function requeueWithBackoff(problemId: string, attempt: number, errorReason: string) {
  const backoffMs = Math.min(Math.pow(2, attempt) * 1000, 30000);
  logger.warn(`Job failed, requeueing with backoff (attempt ${attempt}/${MAX_RETRIES}) in ${backoffMs}ms`, {
    problemId,
    attempt,
    backoffMs,
    error: errorReason,
  });

  setTimeout(async () => {
    try {
      if (redis) {
        await redis.rpush(redisKeys.problemProcessingQueue(), problemId);
      }
    } catch (err) {
      logger.error('Failed to re-push job to queue', { problemId, error: String(err) });
    }
  }, backoffMs);
}

/**
 * Worker Main Consumer Loop
 */
async function startConsumerLoop() {
  logger.info('Starting problem processing worker loop', {
    queue: redisKeys.problemProcessingQueue(),
    maxRetries: MAX_RETRIES,
  });

  while (!isShuttingDown) {
    let rawItem: string | null = null;

    try {
      if (!redis) {
        logger.error('Redis client not configured. Check UPSTASH_REDIS_REST_URL/TOKEN.');
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      // Pop from processing queue
      rawItem = await redis.rpop<string>(redisKeys.problemProcessingQueue());

      if (!rawItem) {
        // Queue is empty; wait before next pop
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_EMPTY_MS));
        continue;
      }

      const problemId = typeof rawItem === 'string' ? rawItem.trim() : String(rawItem);
      if (!problemId) continue;

      isJobInFlight = true;

      try {
        const result = await processProblemJob(problemId);
        lastSuccessfulJobAt = new Date().toISOString();
        totalJobsProcessed++;

        logger.info('Job successfully processed by worker', {
          problemId,
          finalStatus: result.finalStatus,
          durationMs: result.durationMs,
        });
      } catch (jobError: any) {
        const errorReason = jobError?.message || String(jobError);
        logger.error('Job encountered unexpected error during pipeline execution', {
          problemId,
          error: errorReason,
          stack: jobError?.stack,
        });

        const attempt = await incrementRetryCount(problemId);
        if (attempt > MAX_RETRIES) {
          await moveToDeadLetter(problemId, errorReason);
        } else {
          await requeueWithBackoff(problemId, attempt, errorReason);
        }
      } finally {
        isJobInFlight = false;
      }
    } catch (loopError) {
      isJobInFlight = false;
      logger.error('Worker loop iteration error', { error: String(loopError) });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  logger.info('Worker consumer loop stopped cleanly');
}

/**
 * Graceful Shutdown Handler
 */
function setupGracefulShutdown() {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`Received ${signal}, initiating graceful shutdown...`);

    // Stop accepting new health requests
    server.close(() => {
      logger.info('HTTP health server closed');
    });

    // Wait for active in-flight job if running (up to 15s)
    const startWait = Date.now();
    while (isJobInFlight && Date.now() - startWait < 15000) {
      logger.info('Waiting for in-flight job to finish before exit...');
      await new Promise((r) => setTimeout(r, 500));
    }

    logger.info('Worker shutdown completed cleanly. Exiting.');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Process Bootstrap
 */
async function main() {
  logger.info('Initializing Production Problem-Processing Worker...');

  // 1. Warm model in memory once at process startup
  logger.info('Warming embedding model in memory...');
  await warmEmbeddingModel();
  logger.info('Embedding model initialized and warmed');

  // 2. Start HTTP Health Server
  server.listen(PORT, () => {
    logger.info(`Health check server listening on port ${PORT} (GET /health)`);
  });

  // 3. Register Graceful Shutdown handlers
  setupGracefulShutdown();

  // 4. Start Consumer Loop
  await startConsumerLoop();
}

// Execute worker process
main().catch((err) => {
  logger.error('Worker failed to start', { error: String(err), stack: err?.stack });
  process.exit(1);
});
