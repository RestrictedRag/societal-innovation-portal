import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { resourceOffers, universityProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const offers = await db.query.resourceOffers.findMany({
      where: projectId ? eq(resourceOffers.projectId, projectId) : undefined,
      orderBy: [desc(resourceOffers.createdAt)],
      with: {
        project: {
          with: {
            problem: true,
            leadUniversity: true,
          },
        },
        corporateUser: {
          columns: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ offers });
  } catch (error: any) {
    console.error('Resource offers fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve resource offers.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : null;
    const offeringType = typeof body?.offeringType === 'string' ? body.offeringType.trim() : '';
    const details = typeof body?.details === 'string' ? body.details.trim() : '';

    if (!projectId || !offeringType || !details) {
      return NextResponse.json({ error: 'projectId, offeringType, and details are required.' }, { status: 400 });
    }

    const project = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.id, projectId),
    });

    if (!project) {
      return NextResponse.json({ error: 'Target university project not found.' }, { status: 404 });
    }

    const [createdOffer] = await db
      .insert(resourceOffers)
      .values({
        projectId,
        corporateUserId: user.id,
        offeringType,
        details,
        status: 'OFFERED',
      })
      .returning();

    return NextResponse.json({
      message: 'Resource offer submitted successfully.',
      offer: createdOffer,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Resource offer submit error:', error);
    return NextResponse.json({ error: 'Failed to submit resource offer.' }, { status: 500 });
  }
}
