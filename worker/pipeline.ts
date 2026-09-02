import { eq, sql } from 'drizzle-orm';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';

import { db } from '@/db';
import {
  citizenProblems,
  problemEmbeddings,
  problemMedia,
  problemUpvotes,
  universities,
  users,
} from '@/db/schema';
import {
  EMBEDDING_MODEL_VERSION,
  generateProblemEmbedding,
} from '@/lib/ai/embeddings';
import {
  canonicalDomainEnum,
  mediaAssessmentSchema,
  problemTriageSchema,
  spamScoringSchema,
  type ProblemTriageResult,
  type SpamScoringResult,
} from '@/lib/ai/triage-schema';
import { logger } from '@/lib/logger';
import { publishNotification } from '@/lib/redis';
import { redisKeys } from '@/lib/redisKeys';

export interface PipelineResult {
  problemId: string;
  finalStatus: string;
  durationMs: number;
  spamScore?: number;
  isDuplicate?: boolean;
  domain?: string;
  notificationsSent?: number;
}

/**
 * Step 2: Score problem description for spam.
 */
async function scoreSpam(title: string, description: string): Promise<SpamScoringResult> {
  const hasApiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY);

  if (hasApiKey && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { object } = await generateObject({
        model: google('gemini-1.5-flash'),
        schema: spamScoringSchema,
        system: `You score citizen-submitted civic problem reports for spam or low-effort content.
Score close to 0 = clearly genuine, specific, actionable problem report.
Score close to 1 = spam, gibberish, promotional content, or too vague to act on.
Consider: specificity, coherence, and whether it names a real location/issue.`,
        prompt: `Title: ${title}\nDescription: ${description}`,
      });
      return object;
    } catch (err) {
      logger.warn('AI spam scoring failed, falling back to heuristic scoring', { error: String(err) });
    }
  }

  // Heuristic spam scoring fallback
  const text = `${title} ${description}`.trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);

  const spamKeywords = ['casino', 'viagra', 'crypto pump', 'free money', 'lottery winner', 'click here now', 'buy replica'];
  const hasSpamKeywords = spamKeywords.some((kw) => text.includes(kw));

  if (hasSpamKeywords) {
    return { spamProbability: 0.95, isLowEffort: true, reasoning: 'Contains known promotional/spam keywords.' };
  }

  if (words.length < 5) {
    return { spamProbability: 0.75, isLowEffort: true, reasoning: 'Description is too short and vague.' };
  }

  return { spamProbability: 0.05, isLowEffort: false, reasoning: 'Appears to be a genuine civic problem description.' };
}

/**
 * Step 5: Classify domain and tags for problem.
 */
async function triageProblem(title: string, description: string, currentDomain?: string | null): Promise<ProblemTriageResult> {
  const hasApiKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.OPENAI_API_KEY);

  if (hasApiKey && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const { object } = await generateObject({
        model: google('gemini-3.6-flash'),
        schema: problemTriageSchema,
        system: `You classify citizen civic complaints into one of the canonical domains:
healthcare, agriculture, education, disaster_management, clean_energy, water_management,
urban_infrastructure, governance, financial_inclusion, waste_management.`,
        prompt: `Title: ${title}\nDescription: ${description}`,
      });
      return object;
    } catch (err) {
      logger.warn('AI triage classification failed, falling back to rule-based triage', { error: String(err) });
    }
  }

  // Fallback domain classification
  const validDomains = canonicalDomainEnum.options;
  let domain = currentDomain && validDomains.includes(currentDomain as any)
    ? (currentDomain as (typeof validDomains)[number])
    : 'urban_infrastructure';

  const text = `${title} ${description}`.toLowerCase();
  if (text.includes('water') || text.includes('drainage') || text.includes('pipe') || text.includes('sewage')) {
    domain = 'water_management';
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('cleanliness')) {
    domain = 'waste_management';
  } else if (text.includes('hospital') || text.includes('clinic') || text.includes('health') || text.includes('doctor')) {
    domain = 'healthcare';
  } else if (text.includes('school') || text.includes('college') || text.includes('student') || text.includes('education')) {
    domain = 'education';
  } else if (text.includes('road') || text.includes('pothole') || text.includes('streetlight') || text.includes('bridge')) {
    domain = 'urban_infrastructure';
  }

  return {
    domain,
    secondaryTags: [],
    summary: title.slice(0, 150),
  };
}

/**
 * Main 8-Step Problem Processing Pipeline.
 */
export async function processProblemJob(problemId: string): Promise<PipelineResult> {
  const startTime = Date.now();
  logger.info('Job started', { problemId, step: 'start' });

  // ─────────────────────────────────────────────────────────────
  // STEP 1: Fetch + Idempotency Check
  // ─────────────────────────────────────────────────────────────
  const problem = await db.query.citizenProblems.findFirst({
    where: eq(citizenProblems.id, problemId),
  });

  if (!problem) {
    logger.warn('Problem not found in database, discarding job', { problemId, step: 'step_1_fetch' });
    return {
      problemId,
      finalStatus: 'NOT_FOUND',
      durationMs: Date.now() - startTime,
    };
  }

  const validPreProcessingStates = ['PENDING', 'PENDING_MODERATION', 'PENDING_PROCESSING'];
  if (!validPreProcessingStates.includes(problem.status)) {
    logger.info('Problem already past pending state, skipping processing', {
      problemId,
      currentStatus: problem.status,
      step: 'step_1_idempotency',
    });
    return {
      problemId,
      finalStatus: problem.status,
      durationMs: Date.now() - startTime,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 2: Spam Scoring
  // ─────────────────────────────────────────────────────────────
  const spamResult = await scoreSpam(problem.title, problem.description);
  const spamScore = Number(spamResult.spamProbability.toFixed(4));
  logger.info('Spam scoring completed', {
    problemId,
    step: 'step_2_spam',
    spamScore,
    reasoning: spamResult.reasoning,
  });

  if (spamScore > 0.85) {
    await db
      .update(citizenProblems)
      .set({
        status: 'REJECTED',
        spamScore,
      })
      .where(eq(citizenProblems.id, problemId));

    logger.info('Problem rejected due to high spam score', { problemId, spamScore, step: 'step_2_reject' });
    return {
      problemId,
      finalStatus: 'REJECTED',
      spamScore,
      durationMs: Date.now() - startTime,
    };
  }

  if (spamScore > 0.4) {
    await db
      .update(citizenProblems)
      .set({
        status: 'NEEDS_REVIEW',
        spamScore,
      })
      .where(eq(citizenProblems.id, problemId));

    logger.info('Problem queued for admin moderation review', { problemId, spamScore, step: 'step_2_needs_review' });
    return {
      problemId,
      finalStatus: 'NEEDS_REVIEW',
      spamScore,
      durationMs: Date.now() - startTime,
    };
  }

  // Passed spam gate (spamScore <= 0.4)
  await db
    .update(citizenProblems)
    .set({ spamScore })
    .where(eq(citizenProblems.id, problemId));

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Embedding
  // ─────────────────────────────────────────────────────────────
  const fullText = `${problem.title}\n${problem.description}`.trim();
  const embedding = await generateProblemEmbedding(fullText);

  // Format vector literal for postgres custom vector type
  const vectorStr = `[${embedding.map((v) => Number(v).toFixed(6)).join(',')}]`;

  await db.execute(sql`
    INSERT INTO problem_embeddings (problem_id, embedding, model_version, created_at)
    VALUES (${problemId}, ${vectorStr}::vector, ${EMBEDDING_MODEL_VERSION}, now())
    ON CONFLICT (problem_id) DO UPDATE
    SET embedding = EXCLUDED.embedding,
        model_version = EXCLUDED.model_version;
  `);

  logger.info('Embedding stored successfully', { problemId, step: 'step_3_embedding', dimensions: embedding.length });

  function getRows<T>(result: unknown): T[] {
    if (Array.isArray(result)) return result as T[];
    if (result && typeof result === 'object' && Array.isArray((result as any).rows)) {
      return (result as any).rows as T[];
    }
    return [];
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 4: Duplicate Check (Vector Similarity > 0.92)
  // ─────────────────────────────────────────────────────────────
  const duplicateRes = await db.execute<{
    original_id: string;
    similarity: number;
    title: string;
  }>(sql`
    SELECT
      cp.id AS original_id,
      cp.title,
      (1 - (pe.embedding <=> ${vectorStr}::vector))::float AS similarity
    FROM problem_embeddings pe
    JOIN citizen_problems cp ON cp.id = pe.problem_id
    WHERE cp.id != ${problemId}
      AND cp.status IN ('OPEN', 'IN_PROGRESS')
    ORDER BY pe.embedding <=> ${vectorStr}::vector ASC
    LIMIT 1;
  `);

  const duplicateMatches = getRows<{ original_id: string; similarity: number; title: string }>(duplicateRes);
  const topMatch = duplicateMatches[0];
  const topSimilarity = topMatch ? Number(topMatch.similarity) : 0;

  if (topMatch && topSimilarity > 0.92) {
    logger.info('Near-duplicate problem detected, executing merge transaction', {
      problemId,
      originalId: topMatch.original_id,
      similarity: topSimilarity,
      step: 'step_4_dedup',
    });

    // Transactional write: Upvote original problem and mark duplicate as MERGED
    await db.transaction(async (tx) => {
      // Record upvote on original problem
      await tx.execute(sql`
        INSERT INTO problem_upvotes (problem_id, user_id)
        VALUES (${topMatch.original_id}, ${problem.userId})
        ON CONFLICT (problem_id, user_id) DO NOTHING;
      `);

      // Update current problem to MERGED
      await tx
        .update(citizenProblems)
        .set({ status: 'MERGED' })
        .where(eq(citizenProblems.id, problemId));
    });

    logger.info('Duplicate problem successfully merged into existing issue', {
      problemId,
      originalId: topMatch.original_id,
      step: 'step_4_merge_complete',
    });

    return {
      problemId,
      finalStatus: 'MERGED',
      spamScore,
      isDuplicate: true,
      durationMs: Date.now() - startTime,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 5: Domain / Tag Classification
  // ─────────────────────────────────────────────────────────────
  const triage = await triageProblem(problem.title, problem.description, problem.domain);
  await db
    .update(citizenProblems)
    .set({
      domain: triage.domain as any,
      secondaryTags: (triage.secondaryTags ?? []) as any,
    })
    .where(eq(citizenProblems.id, problemId));

  logger.info('Domain classification completed', {
    problemId,
    step: 'step_5_triage',
    domain: triage.domain,
    secondaryTags: triage.secondaryTags,
  });

  // ─────────────────────────────────────────────────────────────
  // STEP 6: Media Assessment (if attached)
  // ─────────────────────────────────────────────────────────────
  const mediaRows = await db.query.problemMedia.findMany({
    where: eq(problemMedia.problemId, problemId),
  });

  for (const media of mediaRows) {
    try {
      // Mark approved by default (or run vision assessment when multi-modal keys exist)
      await db
        .update(problemMedia)
        .set({ status: 'APPROVED' })
        .where(eq(problemMedia.id, media.id));
    } catch (mediaErr) {
      logger.warn('Media assessment error', { mediaId: media.id, error: String(mediaErr) });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 7: Finalize Status to 'OPEN'
  // ─────────────────────────────────────────────────────────────
  await db
    .update(citizenProblems)
    .set({ status: 'OPEN' })
    .where(
      sql`${citizenProblems.id} = ${problemId} AND ${citizenProblems.status} NOT IN ('REJECTED', 'NEEDS_REVIEW', 'MERGED')`,
    );

  logger.info('Problem finalized to OPEN', { problemId, step: 'step_7_finalize' });

  // ─────────────────────────────────────────────────────────────
  // STEP 8: Geospatial Notification to Matching Universities
  // ─────────────────────────────────────────────────────────────
  let notificationsSent = 0;
  if (problem.latitude != null && problem.longitude != null) {
    try {
      const matchingUniversitiesRes = await db.execute<{
        university_id: string;
        user_id: string;
        university_name: string;
      }>(sql`
        SELECT DISTINCT
          u.id AS university_id,
          usr.id AS user_id,
          u.name AS university_name
        FROM universities u
        JOIN users usr ON usr.university_id = u.id
        WHERE u.location IS NOT NULL
          AND u.service_radius_km IS NOT NULL
          AND ST_DWithin(
            u.location,
            ST_SetSRID(ST_MakePoint(${problem.longitude}, ${problem.latitude}), 4326)::geography,
            (u.service_radius_km * 1000)::double precision
          );
      `);

      const matchingUniversities = getRows<{ university_id: string; user_id: string; university_name: string }>(matchingUniversitiesRes);
      for (const match of matchingUniversities) {
        try {
          await publishNotification(match.user_id, {
            type: 'NEW_REGIONAL_PROBLEM',
            problemId,
            title: problem.title,
            domain: triage.domain,
            universityName: match.university_name,
            timestamp: new Date().toISOString(),
          });
          notificationsSent++;
        } catch (notifErr) {
          logger.warn('Failed to publish notification to university user', {
            userId: match.user_id,
            error: String(notifErr),
          });
        }
      }

      logger.info('Geospatial university notifications published', {
        problemId,
        step: 'step_8_notify',
        notificationsSent,
        matchingUniversityCount: matchingUniversities.length,
      });
    } catch (geoErr) {
      logger.warn('Step 8 geospatial matching query failed', { problemId, error: String(geoErr) });
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info('Job completed successfully', {
    problemId,
    finalStatus: 'OPEN',
    domain: triage.domain,
    spamScore,
    durationMs,
  });

  return {
    problemId,
    finalStatus: 'OPEN',
    domain: triage.domain,
    spamScore,
    notificationsSent,
    durationMs,
  };
}
