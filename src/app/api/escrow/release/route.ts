import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { escrowLedger, universityProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const escrowId = typeof body?.escrowId === 'string' ? body.escrowId.trim() : null;

    if (!escrowId) {
      return NextResponse.json({ error: 'escrowId is required.' }, { status: 400 });
    }

    const escrowEntry = await db.query.escrowLedger.findFirst({
      where: eq(escrowLedger.id, escrowId),
    });

    if (!escrowEntry) {
      return NextResponse.json({ error: 'Escrow ledger entry not found.' }, { status: 404 });
    }

    // Only the sponsoring corporate rep or an admin can manually release
    if (user.role !== 'ADMIN' && (user.role !== 'COMPANY_REP' || user.id !== escrowEntry.corporateId)) {
      return NextResponse.json({ error: 'Unauthorized to release this escrow deposit.' }, { status: 403 });
    }

    if (escrowEntry.status !== 'HELD') {
      return NextResponse.json({ error: `Escrow funds cannot be released because current status is ${escrowEntry.status}.` }, { status: 400 });
    }

    const [updatedEntry] = await db
      .update(escrowLedger)
      .set({
        status: 'RELEASED',
        releasedAt: new Date(),
      })
      .where(eq(escrowLedger.id, escrowId))
      .returning();

    // Increment project budget
    await db
      .update(universityProjects)
      .set({
        budget: sql`${universityProjects.budget} + ${updatedEntry.amount}`,
      })
      .where(eq(universityProjects.id, updatedEntry.projectId));

    return NextResponse.json({
      success: true,
      message: `Escrow deposit of $${Number(updatedEntry.amount).toLocaleString()} successfully RELEASED and credited to project budget.`,
      escrow: updatedEntry,
    });
  } catch (error: any) {
    console.error('Escrow release error:', error);
    return NextResponse.json({ error: 'Failed to release escrow deposit.' }, { status: 500 });
  }
}
