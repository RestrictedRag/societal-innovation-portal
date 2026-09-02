import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { interestRequests, universityProjects, notifications } from '@/db/schema';
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

    const requests = await db.query.interestRequests.findMany({
      where: projectId
        ? eq(interestRequests.projectId, projectId)
        : eq(interestRequests.userId, user.id),
      orderBy: [desc(interestRequests.createdAt)],
      with: {
        project: {
          with: {
            problem: true,
            leadUniversity: true,
          },
        },
        targetUser: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ interestRequests: requests });
  } catch (error: any) {
    console.error('Interest requests fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve interest requests.' }, { status: 500 });
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
    const targetType = typeof body?.targetType === 'string' ? body.targetType : 'PROJECT';
    const targetUserId = typeof body?.targetUserId === 'string' ? body.targetUserId : null;
    const interestType = typeof body?.interestType === 'string' ? body.interestType : 'EXPLORATORY_MEETING';
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const supportDetails = typeof body?.supportDetails === 'string' ? body.supportDetails.trim() : null;
    const preferredTime = typeof body?.preferredTime === 'string' ? body.preferredTime.trim() : null;
    const contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim() : user.email;

    if (!projectId || !message) {
      return NextResponse.json({ error: 'projectId and message are required.' }, { status: 400 });
    }

    const project = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.id, projectId),
      with: { problem: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Target university project not found.' }, { status: 404 });
    }

    const [createdRequest] = await db
      .insert(interestRequests)
      .values({
        userId: user.id,
        projectId,
        targetType,
        targetUserId: targetUserId || project.claimedByUserId,
        interestType,
        message,
        supportDetails,
        preferredTime,
        contactEmail,
        status: 'PENDING',
      })
      .returning();

    // Send notification
    const recipientId = targetUserId || project.claimedByUserId;
    if (recipientId) {
      await db.insert(notifications).values({
        userId: recipientId,
        title: `Meeting & Interest Request: ${interestType.replace(/_/g, ' ')}`,
        message: `${user.fullName || 'An industry partner'} requested a meeting regarding "${project.problem?.title || 'your project'}".`,
        type: 'INTEREST',
        link: `/university`,
      });
    }

    return NextResponse.json(
      {
        message: 'Interest request submitted successfully.',
        interestRequest: createdRequest,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Interest request create error:', error);
    return NextResponse.json({ error: 'Failed to submit interest request.' }, { status: 500 });
  }
}
