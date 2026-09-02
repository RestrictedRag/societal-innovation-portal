import { NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import { projectUpdates, universityProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const projectId = params.id;

    const milestones = await db.query.projectUpdates.findMany({
      where: eq(projectUpdates.projectId, projectId),
      orderBy: [desc(projectUpdates.trlLevel), desc(projectUpdates.createdAt)],
      with: {
        verifier: {
          columns: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ milestones });
  } catch (error: any) {
    console.error('Milestones fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve milestones.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const projectId = params.id;

    const authResult = await requireRole(['STUDENT', 'FACULTY', 'ADMIN']);
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

    // Must be student/faculty associated with this project's lead university or admin
    const isAuthorized =
      user.role === 'ADMIN' ||
      ((user.role === 'STUDENT' || user.role === 'FACULTY') && user.universityId === project.leadUniversityId);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Only members of the lead university team can submit milestones for this project.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const trlLevel = Number(body?.trlLevel);
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const evidenceUrl = typeof body?.evidenceUrl === 'string' ? body.evidenceUrl.trim() : null;

    if (!trlLevel || trlLevel < 1 || trlLevel > 9) {
      return NextResponse.json({ error: 'trlLevel must be an integer between 1 and 9.' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Milestone description is required.' }, { status: 400 });
    }

    const [milestone] = await db
      .insert(projectUpdates)
      .values({
        projectId,
        trlLevel,
        description,
        evidenceUrl,
        verified: false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: `TRL Level ${trlLevel} milestone submitted successfully.`,
      milestone,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Milestone submission error:', error);
    return NextResponse.json({ error: 'Failed to submit milestone update.' }, { status: 500 });
  }
}
