import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projectPilots, notifications } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(['STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const { id: pilotId } = await context.params;

    const existing = await db.query.projectPilots.findFirst({
      where: eq(projectPilots.id, pilotId),
      with: { project: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pilot record not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Partial<typeof projectPilots.$inferInsert> = {};

    if (typeof body.status === 'string') updates.status = body.status;
    if (typeof body.progressPercent === 'number') updates.progressPercent = body.progressPercent;
    if (typeof body.impactSummary === 'string') updates.impactSummary = body.impactSummary.trim();
    if (typeof body.metricsJson === 'string') updates.metricsJson = body.metricsJson;
    else if (body.metrics && typeof body.metrics === 'object') updates.metricsJson = JSON.stringify(body.metrics);
    if (typeof body.responsibleContact === 'string') updates.responsibleContact = body.responsibleContact.trim();
    if (typeof body.infrastructureDetails === 'string') updates.infrastructureDetails = body.infrastructureDetails.trim();
    if (body.endDate) updates.endDate = new Date(body.endDate);

    updates.updatedAt = new Date();

    const [updatedPilot] = await db
      .update(projectPilots)
      .set(updates)
      .where(eq(projectPilots.id, pilotId))
      .returning();

    // Send status notification
    if (body.status && body.status !== existing.status) {
      const recipientId = user.role === 'COMPANY_REP' ? existing.project.claimedByUserId : existing.companyUserId;
      if (recipientId) {
        await db.insert(notifications).values({
          userId: recipientId,
          title: `Pilot Status Update: ${body.status}`,
          message: `Pilot "${existing.title}" is now ${body.status}. Progress: ${updatedPilot.progressPercent}%.`,
          type: 'PILOT',
          link: `/corporate`,
        });
      }
    }

    return NextResponse.json({
      message: 'Pilot updated successfully.',
      pilot: updatedPilot,
    });
  } catch (error: any) {
    console.error('Pilot update error:', error);
    return NextResponse.json({ error: 'Failed to update pilot.' }, { status: 500 });
  }
}
