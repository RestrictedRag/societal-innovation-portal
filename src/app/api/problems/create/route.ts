import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { citizenProblems, problemMedia, users } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { enqueueProblemJob } from '@/lib/redis';

async function getSessionUserEmail() {
  const session = await auth.api.getSession({
    headers: headers(),
  });
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
    const title = String(payload?.title ?? '').trim();
    const description = String(payload?.description ?? '').trim();
    const domain = String(payload?.domain ?? '').trim();
    const imageUrl = typeof payload?.imageUrl === 'string' ? payload.imageUrl.trim() : null;
    const mediaUrls = Array.isArray(payload?.media)
      ? payload.media
          .map((entry: unknown) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter((entry: string): entry is string => Boolean(entry))
      : [];

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
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

    let createdProblem: { id: string; createdAt: Date } | null = null;
    try {
      [createdProblem] = await db
        .insert(citizenProblems)
        .values({
          userId,
          title,
          description,
          imageUrl: imageUrl || null,
          status: 'PENDING_MODERATION',
          domain: domain ? (domain as any) : null,
        })
        .returning({ id: citizenProblems.id, createdAt: citizenProblems.createdAt });
    } catch (error) {
      console.error('Problem create failed: DB insert', {
        userId,
        title,
        domain,
        error: describeError(error),
      });
      throw error;
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
        throw error;
      }
    }

    try {
      await enqueueProblemJob(createdProblem!.id);
    } catch (queueError) {
      console.error('Problem create failed: Redis enqueue', {
        problemId: createdProblem?.id,
        userId,
        error: describeError(queueError),
      });
      return NextResponse.json(
        {
          error:
            queueError instanceof Error
              ? queueError.message
              : 'Redis job queue is not configured. Please add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before submitting problems.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Problem submitted successfully.',
      problem: {
        id: createdProblem!.id,
        title,
        description,
        domain,
        imageUrl: imageUrl || null,
        createdAt: createdProblem!.createdAt,
      },
    });
  } catch (error) {
    console.error('Problem create failed: unhandled error', {
      error: describeError(error),
    });
    return NextResponse.json({ error: 'Something went wrong while submitting your problem.' }, { status: 500 });
  }
}
