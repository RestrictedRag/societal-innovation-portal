import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { citizenProblems, problemMedia } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { enqueueProblemJob } from '@/lib/redis';

function describeError(error: unknown) {
  if (error && typeof error === 'object') {
    const err = error as any;
    const cause = err.cause ?? err;
    return {
      name: err.name,
      message: cause?.message || err.message,
      code: cause?.code || err.code,
      detail: cause?.detail,
      constraint: cause?.constraint,
      stack: err.stack,
    };
  }

  return {
    value: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const payload = await request.json();
    const rawClientId = typeof payload?.clientId === 'string' ? payload.clientId.trim() : null;
    const clientId = rawClientId || crypto.randomUUID();

    const title = String(payload?.title ?? '').trim();
    const description = String(payload?.description ?? '').trim();
    const domain = String(payload?.domain ?? '').trim();
    const problemType = typeof payload?.problemType === 'string' ? payload.problemType.trim() : null;
    const category = typeof payload?.category === 'string' ? payload.category.trim() : null;
    const subcategory = typeof payload?.subcategory === 'string' ? payload.subcategory.trim() : null;
    const imageUrl = typeof payload?.imageUrl === 'string' ? payload.imageUrl.trim() : null;
    const rawLat = payload?.latitude ?? payload?.location?.lat;
    const rawLng = payload?.longitude ?? payload?.location?.lng;
    const latitude = typeof rawLat === 'number' && Number.isFinite(rawLat) ? rawLat : null;
    const longitude = typeof rawLng === 'number' && Number.isFinite(rawLng) ? rawLng : null;

    const mediaUrls = Array.isArray(payload?.media)
      ? payload.media
          .map((entry: unknown) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry: string): entry is string => Boolean(entry))
      : [];

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    // 1. Fast existence check for idempotency
    const existing = await db.query.citizenProblems.findFirst({
      where: eq(citizenProblems.clientId, clientId),
    });

    if (existing) {
      return NextResponse.json({
        message: 'Problem already submitted.',
        problem: {
          id: existing.id,
          clientId: existing.clientId,
          title: existing.title,
          description: existing.description,
          domain: existing.domain,
          imageUrl: existing.imageUrl,
          latitude: existing.latitude,
          longitude: existing.longitude,
          createdAt: existing.createdAt.toISOString(),
        },
      }, { status: 200 });
    }

    const userId = user.id;

    let createdProblem: { id: string; clientId: string; createdAt: Date } | null = null;
    const insertValues = {
      clientId,
      userId,
      title,
      description,
      imageUrl: imageUrl || null,
      latitude,
      longitude,
      status: 'PENDING_MODERATION' as const,
      domain: domain ? (domain as any) : null,
      problemType: problemType || null,
      category: category || null,
      subcategory: subcategory || null,
    };
    console.log('[REPRO] Exact insert values:', JSON.stringify(insertValues));
    try {
      [createdProblem] = await db
        .insert(citizenProblems)
        .values(insertValues)
        .returning({
          id: citizenProblems.id,
          clientId: citizenProblems.clientId,
          createdAt: citizenProblems.createdAt,
        });
      console.log('[REPRO] Insert returned:', JSON.stringify(createdProblem));
    } catch (insertError: any) {
      const cause = insertError?.cause ?? insertError;
      const pgCode = cause?.code || insertError?.code;

      // Handle race condition: concurrent request with same clientId
      if (pgCode === '23505' || String(cause?.message || insertError?.message).includes('duplicate key')) {
        const raceExisting = await db.query.citizenProblems.findFirst({
          where: eq(citizenProblems.clientId, clientId),
        });

        if (raceExisting) {
          return NextResponse.json({
            message: 'Problem already submitted.',
            problem: {
              id: raceExisting.id,
              clientId: raceExisting.clientId,
              title: raceExisting.title,
              description: raceExisting.description,
              domain: raceExisting.domain,
              imageUrl: raceExisting.imageUrl,
              latitude: raceExisting.latitude,
              longitude: raceExisting.longitude,
              createdAt: raceExisting.createdAt.toISOString(),
            },
          }, { status: 200 });
        }
      }

      const described = describeError(insertError);
      console.error('[DIAGNOSTICS] Problem create failed: DB insert error:', {
        userId,
        clientId,
        title,
        domain,
        error: described,
      });
      throw insertError;
    }

    const mediaEntries = [...new Set([...(imageUrl ? [imageUrl] : []), ...mediaUrls])];
    if (mediaEntries.length > 0) {
      try {
        await db.insert(problemMedia).values(
          mediaEntries.map((mediaUrl): { problemId: string; url: string; status: 'APPROVED' } => ({
            problemId: createdProblem!.id,
            url: mediaUrl,
            status: 'APPROVED',
          })),
        );
      } catch (error) {
        console.error('Problem create failed: DB media insert', {
          userId,
          problemId: createdProblem?.id,
          mediaCount: mediaEntries.length,
          error: describeError(error),
        });
      }
    }

    try {
      await enqueueProblemJob(createdProblem!.id);
    } catch (queueError) {
      console.warn('Problem create: Redis job queue warning', {
        problemId: createdProblem?.id,
        userId,
        error: describeError(queueError),
      });
    }

    return NextResponse.json(
      {
        message: 'Problem submitted successfully.',
        problem: {
          id: createdProblem!.id,
          clientId: createdProblem!.clientId,
          title,
          description,
          domain,
          imageUrl: imageUrl || null,
          latitude,
          longitude,
          createdAt: createdProblem!.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    const errorDetails = describeError(error);
    console.error('Problem create failed: unhandled error', {
      error: errorDetails,
    });
    const errorMessage = error?.cause?.message ?? error?.message ?? 'Something went wrong while submitting your problem.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
