import { NextResponse } from 'next/server';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '@/db';
import { problemUpvotes, users } from '@/db/schema';
import { auth } from '@/lib/auth/server';
import { resolveAuthUser } from '@/lib/auth/resolve-user';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params;
    if (!problemId) {
      return NextResponse.json({ error: 'Problem ID is required.' }, { status: 400 });
    }

    // Resolve user ID via standardized helper
    const authResult = await resolveAuthUser();
    let resolvedUserId: string | null = authResult.success ? authResult.user.id : null;

    if (!resolvedUserId) {
      // Fallback demo citizen user for public/demo upvoting
      const demoUser = await db.query.users.findFirst({
        where: eq(users.email, 'demo.citizen@civicnexus.demo'),
      });
      resolvedUserId = demoUser?.id ?? null;
    }

    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Unable to register upvote without user session.' }, { status: 401 });
    }

    // Check if user already upvoted
    const existing = await db.query.problemUpvotes.findFirst({
      where: and(
        eq(problemUpvotes.problemId, problemId),
        eq(problemUpvotes.userId, resolvedUserId)
      ),
    });

    let hasUpvoted = false;
    if (existing) {
      // Remove upvote (toggle off)
      await db
        .delete(problemUpvotes)
        .where(eq(problemUpvotes.id, existing.id));
      hasUpvoted = false;
    } else {
      // Insert upvote (toggle on)
      await db.insert(problemUpvotes).values({
        problemId,
        userId: resolvedUserId,
      });
      hasUpvoted = true;
    }

    // Get updated count
    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(problemUpvotes)
      .where(eq(problemUpvotes.problemId, problemId));
    const upvotesCount = countRes[0]?.count ?? 0;

    return NextResponse.json({
      success: true,
      hasUpvoted,
      upvotesCount,
    });
  } catch (error) {
    console.error('Failed to toggle post upvote:', error);
    return NextResponse.json({ error: 'Failed to process upvote.' }, { status: 500 });
  }
}
