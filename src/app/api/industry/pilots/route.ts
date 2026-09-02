import { NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  projectPilots,
  universityProjects,
  notifications,
} from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const statusFilter = searchParams.get('status');
    const mineOnly = searchParams.get('mine') === 'true' || user.role === 'COMPANY_REP';

    const conditions = [];
    if (projectId) {
      conditions.push(eq(projectPilots.projectId, projectId));
    }
    if (mineOnly && user.role === 'COMPANY_REP') {
      conditions.push(eq(projectPilots.companyUserId, user.id));
    }
    if (statusFilter && statusFilter !== 'ALL') {
      conditions.push(eq(projectPilots.status, statusFilter));
    }

    const pilots = await db.query.projectPilots.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(projectPilots.createdAt)],
      with: {
        project: {
          with: {
            problem: true,
            leadUniversity: true,
            claimedByUser: {
              columns: {
                id: true,
                fullName: true,
                email: true,
                department: true,
                skills: true,
              },
            },
            updates: true,
          },
        },
        companyUser: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        collaboration: true,
      },
    });

    return NextResponse.json({ pilots });
  } catch (error: any) {
    console.error('Pilots fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve pilots.' }, { status: 500 });
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
    const collaborationId = typeof body?.collaborationId === 'string' ? body.collaborationId.trim() : null;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const location = typeof body?.location === 'string' ? body.location.trim() : '';
    const startDate = body?.startDate ? new Date(body.startDate) : new Date();
    const endDate = body?.endDate ? new Date(body.endDate) : null;
    const objective = typeof body?.objective === 'string' ? body.objective.trim() : '';
    const targetPopulation = typeof body?.targetPopulation === 'string' ? body.targetPopulation.trim() : null;
    const infrastructureDetails = typeof body?.infrastructureDetails === 'string' ? body.infrastructureDetails.trim() : null;
    const expectedMetrics = typeof body?.expectedMetrics === 'string' ? body.expectedMetrics.trim() : null;
    const responsibleContact = typeof body?.responsibleContact === 'string' ? body.responsibleContact.trim() : user.fullName;
    const metricsJson = typeof body?.metricsJson === 'string' ? body.metricsJson : JSON.stringify(body?.metrics || {});

    if (!projectId || !title || !location || !objective) {
      return NextResponse.json({ error: 'projectId, title, location, and objective are required.' }, { status: 400 });
    }

    const project = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.id, projectId),
      with: { problem: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Target university project not found.' }, { status: 404 });
    }

    const [createdPilot] = await db
      .insert(projectPilots)
      .values({
        projectId,
        companyUserId: user.id,
        collaborationId,
        title,
        location,
        startDate,
        endDate,
        objective,
        targetPopulation,
        infrastructureDetails,
        expectedMetrics,
        responsibleContact,
        status: 'PROPOSED',
        progressPercent: 10,
        metricsJson,
      })
      .returning();

    // Create notification for student and faculty
    if (project.claimedByUserId) {
      await db.insert(notifications).values({
        userId: project.claimedByUserId,
        title: 'New Pilot Testbed Proposed',
        message: `${user.fullName || 'An industry partner'} proposed a live municipal pilot: "${title}" at ${location}.`,
        type: 'PILOT',
        link: `/corporate`,
      });
    }

    return NextResponse.json(
      {
        message: 'Live pilot testbed proposed successfully.',
        pilot: createdPilot,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Pilot create error:', error);
    return NextResponse.json({ error: 'Failed to propose pilot.' }, { status: 500 });
  }
}
