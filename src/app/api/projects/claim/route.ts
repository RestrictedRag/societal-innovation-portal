import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { citizenProblems, universityProjects, users } from '@/db/schema';

export async function POST(request: Request) {
  try {
    const { data: session } = await auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: missing session' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.authUserId, session.user.id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: 'User account is not verified.' }, { status: 403 });
    }

    if (user.role !== 'STUDENT' && user.role !== 'FACULTY') {
      return NextResponse.json({ error: 'Only students or faculty can claim projects' }, { status: 403 });
    }

    if (!user.universityId) {
      return NextResponse.json({ error: 'User is not associated with an accredited university.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const problemId = typeof body?.problemId === 'string' ? body.problemId.trim() : null;
    const budget = typeof body?.budget === 'number' || typeof body?.budget === 'string' ? String(body.budget) : '0';

    if (!problemId) {
      return NextResponse.json({ error: 'problemId is required' }, { status: 400 });
    }

    const problem = await db.query.citizenProblems.findFirst({
      where: eq(citizenProblems.id, problemId),
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Check if already claimed by this university
    const existingProject = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.problemId, problemId),
    });

    if (existingProject) {
      return NextResponse.json({
        message: 'Project already claimed for this problem.',
        project: existingProject,
      }, { status: 200 });
    }

    const [createdProject] = await db
      .insert(universityProjects)
      .values({
        problemId,
        leadUniversityId: user.universityId,
        claimedByUserId: user.id,
        status: 'ACTIVE',
        budget,
      })
      .returning();

    await db
      .update(citizenProblems)
      .set({
        claimedBy: user.id,
        status: 'CLAIMED',
      })
      .where(eq(citizenProblems.id, problemId));

    return NextResponse.json({
      message: 'Project claimed successfully.',
      project: createdProject,
    }, { status: 201 });
  } catch (error: any) {
    const cause = error?.cause ?? error;
    console.error('Project claim error:', {
      name: error?.name,
      message: cause?.message || error?.message,
      code: cause?.code || error?.code,
      detail: cause?.detail,
      stack: error?.stack,
    });
    const errorMessage = error?.cause?.message ?? error?.message ?? 'Failed to claim project.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}

