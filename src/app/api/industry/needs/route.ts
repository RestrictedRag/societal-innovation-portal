import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { industryNeeds } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const mineOnly = searchParams.get('mine') === 'true';

    const needs = await db.query.industryNeeds.findMany({
      where: mineOnly ? eq(industryNeeds.companyUserId, user.id) : undefined,
      orderBy: [desc(industryNeeds.createdAt)],
      with: {
        companyUser: {
          columns: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            city: true,
            state: true,
          },
        },
      },
    });

    return NextResponse.json({ needs });
  } catch (error: any) {
    console.error('Industry needs fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve industry needs.' }, { status: 500 });
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
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const domain = typeof body?.domain === 'string' ? body.domain.trim() : null;
    const targetTrl = typeof body?.targetTrl === 'number' ? body.targetTrl : 4;
    const resourceOfferings = Array.isArray(body?.resourceOfferings) ? body.resourceOfferings : [];
    const technology = Array.isArray(body?.technology) ? body.technology : [];
    const problemCategory = typeof body?.problemCategory === 'string' ? body.problemCategory.trim() : null;
    const requiredSkills = Array.isArray(body?.requiredSkills) ? body.requiredSkills : [];
    const preferredProjectType = typeof body?.preferredProjectType === 'string' ? body.preferredProjectType : 'BOTH';
    const expectedOutcome = typeof body?.expectedOutcome === 'string' ? body.expectedOutcome.trim() : null;
    const fundingAvailable = typeof body?.fundingAvailable === 'string' ? body.fundingAvailable.trim() : null;
    const pilotOpportunity = typeof body?.pilotOpportunity === 'string' ? body.pilotOpportunity.trim() : null;
    const timeline = typeof body?.timeline === 'string' ? body.timeline.trim() : null;
    const location = typeof body?.location === 'string' ? body.location.trim() : null;
    const status = typeof body?.status === 'string' ? body.status : 'OPEN';

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
    }

    const [createdNeed] = await db
      .insert(industryNeeds)
      .values({
        companyUserId: user.id,
        title,
        description,
        domain: domain ? (domain as any) : null,
        targetTrl,
        resourceOfferings,
        technology,
        problemCategory,
        requiredSkills,
        preferredProjectType,
        expectedOutcome,
        fundingAvailable,
        pilotOpportunity,
        timeline,
        location,
        status,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Industry innovation challenge published successfully.',
        need: createdNeed,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Industry need create error:', error);
    return NextResponse.json({ error: 'Failed to post industry need.' }, { status: 500 });
  }
}
