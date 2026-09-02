import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { escrowLedger, universityProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const projectId = params.id;

    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const project = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const rawAmount = Number(body?.amount);
    const milestoneId = typeof body?.milestoneId === 'string' ? body.milestoneId.trim() : null;

    if (!rawAmount || rawAmount <= 0) {
      return NextResponse.json({ error: 'A valid positive sponsorship amount is required.' }, { status: 400 });
    }

    const amount = rawAmount.toFixed(2);

    const [escrowEntry] = await db
      .insert(escrowLedger)
      .values({
        projectId,
        milestoneId,
        corporateId: user.id,
        amount,
        status: 'HELD',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `Successfully pledged $${Number(amount).toLocaleString()} to escrow for this project. Funds will remain HELD until milestone verification.`,
      escrow: escrowEntry,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Project sponsor error:', error);
    return NextResponse.json({ error: 'Failed to process project sponsorship pledge.' }, { status: 500 });
  }
}
