import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { citizenProblems, problemEmbeddings } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { EMBEDDING_MODEL_VERSION, generateProblemEmbedding } from '@/lib/ai/embeddings';

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(['ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const problemId = typeof body?.problemId === 'string' ? body.problemId.trim() : null;
    const action = body?.action as 'APPROVE' | 'REJECT' | undefined;

    if (!problemId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'problemId and valid action ("APPROVE" or "REJECT") are required.' },
        { status: 400 },
      );
    }

    const problem = await db.query.citizenProblems.findFirst({
      where: eq(citizenProblems.id, problemId),
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found.' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // 1. Ensure embedding is generated if missing
      const existingEmbedding = await db.query.problemEmbeddings.findFirst({
        where: eq(problemEmbeddings.problemId, problemId),
      });

      if (!existingEmbedding) {
        try {
          const fullText = `${problem.title}\n${problem.description}`.trim();
          const embedding = await generateProblemEmbedding(fullText);
          const vectorStr = `[${embedding.map((v) => Number(v).toFixed(6)).join(',')}]`;

          await db.execute(sql`
            INSERT INTO problem_embeddings (problem_id, embedding, model_version, created_at)
            VALUES (${problemId}, ${vectorStr}::vector, ${EMBEDDING_MODEL_VERSION}, now())
            ON CONFLICT (problem_id) DO NOTHING;
          `);
        } catch (embedError) {
          console.warn('Embedding generation during admin approval failed:', embedError);
        }
      }

      // 2. Set status to OPEN
      await db
        .update(citizenProblems)
        .set({ status: 'OPEN' })
        .where(eq(citizenProblems.id, problemId));

      return NextResponse.json({
        success: true,
        message: 'Problem approved and published to feed.',
        status: 'OPEN',
      });
    }

    if (action === 'REJECT') {
      await db
        .update(citizenProblems)
        .set({ status: 'REJECTED' })
        .where(eq(citizenProblems.id, problemId));

      return NextResponse.json({
        success: true,
        message: 'Problem rejected.',
        status: 'REJECTED',
      });
    }

    return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin moderate error:', error);
    return NextResponse.json({ error: 'Failed to apply moderation action.' }, { status: 500 });
  }
}
