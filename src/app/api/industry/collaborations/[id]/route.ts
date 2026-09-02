import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { industryCollaborations, notifications } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(['STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const { id: collaborationId } = await context.params;

    const existing = await db.query.industryCollaborations.findFirst({
      where: eq(industryCollaborations.id, collaborationId),
      with: { project: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Collaboration record not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Partial<typeof industryCollaborations.$inferInsert> = {};

    if (typeof body.status === 'string') updates.status = body.status;
    if (typeof body.facultyFeedback === 'string') updates.facultyFeedback = body.facultyFeedback.trim();
    if (typeof body.commitment === 'string') updates.commitment = body.commitment.trim();
    if (typeof body.estimatedValue === 'string' || typeof body.estimatedValue === 'number') {
      updates.estimatedValue = String(body.estimatedValue);
    }
    if (typeof body.duration === 'string') updates.duration = body.duration.trim();

    updates.updatedAt = new Date();

    const [updatedCollaboration] = await db
      .update(industryCollaborations)
      .set(updates)
      .where(eq(industryCollaborations.id, collaborationId))
      .returning();

    // If faculty or student accepted/rejected, notify company partner
    if (body.status && body.status !== existing.status) {
      await db.insert(notifications).values({
        userId: existing.companyUserId,
        title: `Collaboration Status Update: ${body.status}`,
        message: `Your collaboration proposal "${existing.title}" is now ${body.status}.`,
        type: 'COLLABORATION',
        link: `/corporate`,
      });
    }

    return NextResponse.json({
      message: 'Collaboration updated successfully.',
      collaboration: updatedCollaboration,
    });
  } catch (error: any) {
    console.error('Collaboration update error:', error);
    return NextResponse.json({ error: 'Failed to update collaboration.' }, { status: 500 });
  }
}
