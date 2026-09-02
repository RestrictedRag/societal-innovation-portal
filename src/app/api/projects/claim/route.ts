import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { citizenProblems, universityProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(['STUDENT', 'FACULTY'], {
      requireVerified: true,
      requireUniversity: true,
    });
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const problemId = typeof body?.problemId === 'string' ? body.problemId.trim() : null;
    const budget = typeof body?.budget === 'number' || typeof body?.budget === 'string' ? String(body.budget) : '0';
    const projectType = body?.projectType === 'RESEARCH' ? 'RESEARCH' : 'PROBLEM_SOLVING';

    if (!problemId) {
      return NextResponse.json({ error: 'problemId is required' }, { status: 400 });
    }

    const problem = await db.query.citizenProblems.findFirst({
      where: eq(citizenProblems.id, problemId),
    });

    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Problems must be in OPEN or IN_PROGRESS status to be claimed
    if (problem.status !== 'OPEN' && problem.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: `Problem cannot be claimed because its current status is ${problem.status}.` },
        { status: 400 },
      );
    }

    const leadUniversityId = user.universityId!;

    // Check if ALREADY claimed by THIS specific university (multi-claim allows multiple universities to compete)
    const existingProject = await db.query.universityProjects.findFirst({
      where: and(
        eq(universityProjects.problemId, problemId),
        eq(universityProjects.leadUniversityId, leadUniversityId),
      ),
    });

    if (existingProject) {
      return NextResponse.json({
        message: 'Your university has already claimed this problem.',
        project: existingProject,
      }, { status: 200 });
    }

    const [createdProject] = await db
      .insert(universityProjects)
      .values({
        problemId,
        leadUniversityId,
        claimedByUserId: user.id,
        claimedByEmail: user.email,
        projectType,
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        budget,
      })
      .returning();

    // If problem was OPEN, update to IN_PROGRESS and record claiming user ID & email
    if (problem.status === 'OPEN') {
      await db
        .update(citizenProblems)
        .set({
          status: 'IN_PROGRESS',
          claimedBy: user.id,
          claimedByEmail: user.email,
        })
        .where(eq(citizenProblems.id, problemId));
    }

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

