import { NextResponse } from 'next/server';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  citizenProblems,
  problemMedia,
  problemUpvotes,
  universityProjects,
  universities,
  users,
} from '@/db/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Problem ID is required.' }, { status: 400 });
    }

    // 1. Fetch core citizen problem
    const problem = await db.query.citizenProblems.findFirst({
      where: eq(citizenProblems.id, id),
      with: {
        media: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: 'Post / problem not found.' }, { status: 404 });
    }

    // 2. Fetch upvotes count
    const upvotesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(problemUpvotes)
      .where(eq(problemUpvotes.problemId, id));
    const upvotesCount = upvotesResult[0]?.count ?? 0;

    // 3. Fetch active university projects claiming or working on this problem
    const projects = await db
      .select({
        id: universityProjects.id,
        projectType: universityProjects.projectType,
        status: universityProjects.status,
        budget: universityProjects.budget,
        createdAt: universityProjects.createdAt,
        universityId: universities.id,
        universityName: universities.name,
        studentName: users.fullName,
        studentDepartment: users.department,
      })
      .from(universityProjects)
      .leftJoin(universities, eq(universityProjects.leadUniversityId, universities.id))
      .leftJoin(users, eq(universityProjects.claimedByUserId, users.id))
      .where(eq(universityProjects.problemId, id))
      .orderBy(desc(universityProjects.createdAt));

    return NextResponse.json({
      problem: {
        ...problem,
        upvotesCount,
        projects,
      },
    });
  } catch (error) {
    console.error('Failed to fetch post details:', error);
    return NextResponse.json({ error: 'Failed to retrieve post details.' }, { status: 500 });
  }
}
