import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { industryNeeds } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const { id: needId } = await context.params;

    const existing = await db.query.industryNeeds.findFirst({
      where: user.role === 'ADMIN'
        ? eq(industryNeeds.id, needId)
        : and(eq(industryNeeds.id, needId), eq(industryNeeds.companyUserId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Industry need not found or unauthorized.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Partial<typeof industryNeeds.$inferInsert> = {};

    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.description === 'string') updates.description = body.description.trim();
    if (typeof body.domain === 'string') updates.domain = body.domain as any;
    if (typeof body.targetTrl === 'number') updates.targetTrl = body.targetTrl;
    if (Array.isArray(body.resourceOfferings)) updates.resourceOfferings = body.resourceOfferings;
    if (Array.isArray(body.technology)) updates.technology = body.technology;
    if (typeof body.problemCategory === 'string') updates.problemCategory = body.problemCategory;
    if (Array.isArray(body.requiredSkills)) updates.requiredSkills = body.requiredSkills;
    if (typeof body.preferredProjectType === 'string') updates.preferredProjectType = body.preferredProjectType;
    if (typeof body.expectedOutcome === 'string') updates.expectedOutcome = body.expectedOutcome;
    if (typeof body.fundingAvailable === 'string') updates.fundingAvailable = body.fundingAvailable;
    if (typeof body.pilotOpportunity === 'string') updates.pilotOpportunity = body.pilotOpportunity;
    if (typeof body.timeline === 'string') updates.timeline = body.timeline;
    if (typeof body.location === 'string') updates.location = body.location;
    if (typeof body.status === 'string') updates.status = body.status;

    updates.updatedAt = new Date();

    const [updatedNeed] = await db
      .update(industryNeeds)
      .set(updates)
      .where(eq(industryNeeds.id, needId))
      .returning();

    return NextResponse.json({
      message: 'Industry need updated successfully.',
      need: updatedNeed,
    });
  } catch (error: any) {
    console.error('Industry need update error:', error);
    return NextResponse.json({ error: 'Failed to update industry need.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const { id: needId } = await context.params;

    const existing = await db.query.industryNeeds.findFirst({
      where: user.role === 'ADMIN'
        ? eq(industryNeeds.id, needId)
        : and(eq(industryNeeds.id, needId), eq(industryNeeds.companyUserId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Industry need not found or unauthorized.' }, { status: 404 });
    }

    await db.delete(industryNeeds).where(eq(industryNeeds.id, needId));

    return NextResponse.json({ message: 'Industry need deleted successfully.' });
  } catch (error: any) {
    console.error('Industry need delete error:', error);
    return NextResponse.json({ error: 'Failed to delete industry need.' }, { status: 500 });
  }
}
