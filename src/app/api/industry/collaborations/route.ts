import { NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  industryCollaborations,
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
    const mineOnly = searchParams.get('mine') === 'true' || user.role === 'COMPANY_REP';

    const conditions = [];
    if (projectId) {
      conditions.push(eq(industryCollaborations.projectId, projectId));
    }
    if (mineOnly && user.role === 'COMPANY_REP') {
      conditions.push(eq(industryCollaborations.companyUserId, user.id));
    }

    const collaborations = await db.query.industryCollaborations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(industryCollaborations.createdAt)],
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
      },
    });

    return NextResponse.json({ collaborations });
  } catch (error: any) {
    console.error('Collaborations fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve collaborations.' }, { status: 500 });
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
    const proposalType = typeof body?.proposalType === 'string' ? body.proposalType.trim() : 'MENTORSHIP';
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const commitment = typeof body?.commitment === 'string' ? body.commitment.trim() : null;
    const estimatedValue = typeof body?.estimatedValue === 'number' || typeof body?.estimatedValue === 'string' ? String(body.estimatedValue) : '0';
    const duration = typeof body?.duration === 'string' ? body.duration.trim() : null;
    const contactPerson = typeof body?.contactPerson === 'string' ? body.contactPerson.trim() : user.fullName;
    const contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim() : user.email;

    if (!projectId || !title || !description) {
      return NextResponse.json({ error: 'projectId, title, and description are required.' }, { status: 400 });
    }

    const project = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.id, projectId),
      with: { problem: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Target university project not found.' }, { status: 404 });
    }

    const [createdCollaboration] = await db
      .insert(industryCollaborations)
      .values({
        projectId,
        companyUserId: user.id,
        proposalType,
        title,
        description,
        commitment,
        estimatedValue,
        duration,
        contactPerson,
        contactEmail,
        status: 'PROPOSED',
      })
      .returning();

    // Create a notification for the student owner if present
    if (project.claimedByUserId) {
      await db.insert(notifications).values({
        userId: project.claimedByUserId,
        title: `New Industry Collaboration Proposal: ${proposalType}`,
        message: `${user.fullName || 'An industry partner'} offered ${proposalType} support for "${project.problem?.title || 'your project'}".`,
        type: 'COLLABORATION',
        link: `/university`,
      });
    }

    return NextResponse.json(
      {
        message: 'Industry collaboration proposal submitted successfully.',
        collaboration: createdCollaboration,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Collaboration proposal create error:', error);
    return NextResponse.json({ error: 'Failed to submit collaboration proposal.' }, { status: 500 });
  }
}
