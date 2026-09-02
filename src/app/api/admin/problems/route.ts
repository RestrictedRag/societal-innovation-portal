import { NextResponse } from 'next/server';
import { eq, inArray, desc } from 'drizzle-orm';
import { db } from '@/db';
import { citizenProblems } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    let whereCondition;
    if (statusParam && ['PENDING_MODERATION', 'NEEDS_REVIEW', 'REJECTED', 'OPEN', 'PROCESSING_FAILED'].includes(statusParam)) {
      whereCondition = eq(citizenProblems.status, statusParam as any);
    } else {
      whereCondition = inArray(citizenProblems.status, ['NEEDS_REVIEW', 'PENDING_MODERATION', 'PROCESSING_FAILED', 'REJECTED']);
    }

    const problemRows = await db.query.citizenProblems.findMany({
      where: whereCondition,
      orderBy: [desc(citizenProblems.createdAt)],
      limit: 50,
      with: {
        user: {
          columns: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        media: true,
        embedding: {
          columns: {
            problemId: true,
            modelVersion: true,
          },
        },
      },
    });

    const problems = problemRows.map((p) => ({
      id: p.id,
      clientId: p.clientId,
      title: p.title,
      description: p.description,
      status: p.status,
      spamScore: p.spamScore,
      domain: p.domain,
      imageUrl: p.imageUrl,
      latitude: p.latitude,
      longitude: p.longitude,
      authorName: p.user?.fullName ?? 'Anonymous',
      authorEmail: p.user?.email ?? 'N/A',
      hasEmbedding: Boolean(p.embedding),
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json({ problems });
  } catch (error: any) {
    console.error('Admin problems fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve moderation queue.' }, { status: 500 });
  }
}
