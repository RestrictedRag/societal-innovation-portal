import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { industryNeeds, users } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET() {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }

    const needs = await db.query.industryNeeds.findMany({
      orderBy: [desc(industryNeeds.createdAt)],
      with: {
        companyUser: {
          columns: {
            id: true,
            email: true,
            role: true,
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
    const targetTrl = typeof body?.targetTrl === 'number' ? body.targetTrl : 5;
    const resourceOfferings = Array.isArray(body?.resourceOfferings)
      ? body.resourceOfferings.filter((r: unknown) => typeof r === 'string')
      : [];

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
        status: 'OPEN',
      })
      .returning();

    return NextResponse.json({
      message: 'Industry challenge posted successfully.',
      need: createdNeed,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Industry need create error:', error);
    return NextResponse.json({ error: 'Failed to post industry need.' }, { status: 500 });
  }
}
