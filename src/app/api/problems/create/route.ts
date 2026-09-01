import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { citizenProblems, problemMedia, users } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { enqueueProblemJob } from '@/lib/redis';

async function getSessionUserEmail() {
  const { data: session } = await auth.getSession();
  return session?.user?.email ?? null;
}

function describeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: typeof error === 'string' ? error : JSON.stringify(error),
  };
}

export async function POST(request: Request) {
  try {
    const userEmail = await getSessionUserEmail();
    if (!userEmail) {
      console.error('Problem create failed: auth check', {
        reason: 'missing or invalid Neon Auth session',
      });
      return NextResponse.json({ error: 'You must be signed in to submit a problem.' }, { status: 401 });
    }

    const payload = await request.json();
    const rawClientId = typeof payload?.clientId === 'string' ? payload.clientId.trim() : null;
    const clientId = rawClientId || crypto.randomUUID();

    const title = String(payload?.title ?? '').trim();
    const description = String(payload?.description ?? '').trim();
    const domain = String(payload?.domain ?? '').trim();
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

    const user = await db.query.users.findFirst({ where: eq(users.email, userEmail) });
    if (!user) {
      console.error('Problem create failed: auth check', {
        reason: 'session user not found in database',
        userEmail,
      });
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const userId = user.id;

    let createdProblem: { id: string; clientId: string; createdAt: Date } | null = null;
    try {
      [createdProblem] = await db
        .insert(citizenProblems)
        .values({
          clientId,
          userId,
          title,
          description,
          imageUrl: imageUrl || null,
          latitude,
          longitude,
          status: 'PENDING_MODERATION',
          domain: domain ? (domain as any) : null,
        })
        .returning({
          id: citizenProblems.id,
          clientId: citizenProblems.clientId,
          createdAt: citizenProblems.createdAt,
        });
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

      console.error('Problem create failed: DB insert', {
        userId,
        clientId,
        title,
        domain,
        error: describeError(insertError),
      });
      throw insertError;
    }

    const mediaEntries = [...new Set([...(imageUrl ? [imageUrl] : []), ...mediaUrls])];
    if (mediaEntries.length > 0) {
      try {
        await db.insert(problemMedia).values(
          mediaEntries.map((mediaUrl): { problemId: string; url: string; status: 'PENDING_MODERATION' } => ({
            problemId: createdProblem!.id,
            url: mediaUrl,
            status: 'PENDING_MODERATION',
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
  } catch (error) {
    console.error('Problem create failed: unhandled error', {
      error: describeError(error),
    });
    return NextResponse.json({ error: 'Something went wrong while submitting your problem.' }, { status: 500 });
  }
}
