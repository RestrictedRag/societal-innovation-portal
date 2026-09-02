import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { escrowLedger, projectUpdates, universityProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const projectId = params.id;

    const authResult = await requireRole(['FACULTY', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const milestoneId = typeof body?.milestoneId === 'string' ? body.milestoneId.trim() : null;

    if (!milestoneId) {
      return NextResponse.json({ error: 'milestoneId is required.' }, { status: 400 });
    }

    const milestone = await db.query.projectUpdates.findFirst({
      where: eq(projectUpdates.id, milestoneId),
    });

    if (!milestone || milestone.projectId !== projectId) {
      return NextResponse.json({ error: 'Milestone record not found for this project.' }, { status: 404 });
    }

    // 1. Mark milestone verified
    const [updatedMilestone] = await db
      .update(projectUpdates)
      .set({
        verified: true,
        verifiedBy: user.id,
      })
      .where(eq(projectUpdates.id, milestoneId))
      .returning();

    // 2. Automatically release any matching HELD escrow ledgers for this milestone/project
    const matchingEscrowRows = await db.query.escrowLedger.findMany({
      where: eq(escrowLedger.projectId, projectId),
    });

    let totalReleased = 0;
    for (const entry of matchingEscrowRows) {
      if (entry.status === 'HELD' && (!entry.milestoneId || entry.milestoneId === milestoneId)) {
        await db
          .update(escrowLedger)
          .set({
            status: 'RELEASED',
            releasedAt: new Date(),
          })
          .where(eq(escrowLedger.id, entry.id));

        totalReleased += Number(entry.amount || 0);
      }
    }

    // If escrow was released, increment project budget
    if (totalReleased > 0) {
      await db
        .update(universityProjects)
        .set({
          budget: sql`${universityProjects.budget} + ${totalReleased}`,
        })
        .where(eq(universityProjects.id, projectId));
    }

    return NextResponse.json({
      success: true,
      message: `Milestone TRL ${updatedMilestone.trlLevel} verified successfully.`,
      milestone: updatedMilestone,
      escrowReleasedAmount: totalReleased,
    });
  } catch (error: any) {
    console.error('Milestone verification error:', error);
    return NextResponse.json({ error: 'Failed to verify milestone.' }, { status: 500 });
  }
}
