import { NextResponse } from 'next/server';
import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { savedProjects, universityProjects, projectUpdates } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET() {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const saved = await db.query.savedProjects.findMany({
      where: eq(savedProjects.userId, user.id),
      orderBy: [desc(savedProjects.createdAt)],
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
            pilots: true,
            collaborations: true,
          },
        },
      },
    });

    const enrichedSaved = saved.map((s) => {
      const maxTrl = s.project.updates.reduce((max, u) => Math.max(max, u.trlLevel), 1);
      const verifiedMilestones = s.project.updates.filter((u) => u.verified).length;

      return {
        id: s.id,
        projectId: s.projectId,
        notes: s.notes,
        createdAt: s.createdAt,
        project: {
          ...s.project,
          maxTrl,
          totalMilestones: s.project.updates.length,
          verifiedMilestones,
          hasPilot: s.project.pilots.length > 0,
        },
      };
    });

    return NextResponse.json({ savedProjects: enrichedSaved });
  } catch (error: any) {
    console.error('Saved projects fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve saved projects.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const projectId = typeof body?.projectId === 'string' ? body.projectId.trim() : null;
    const notes = typeof body?.notes === 'string' ? body.notes.trim() : null;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required.' }, { status: 400 });
    }

    const existing = await db.query.savedProjects.findFirst({
      where: and(eq(savedProjects.userId, user.id), eq(savedProjects.projectId, projectId)),
    });

    if (existing) {
      // Toggle off or update
      await db.delete(savedProjects).where(eq(savedProjects.id, existing.id));
      return NextResponse.json({ message: 'Project removed from watchlist.', isSaved: false });
    }

    const [created] = await db
      .insert(savedProjects)
      .values({
        userId: user.id,
        projectId,
        notes,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Project saved to watchlist.',
        isSaved: true,
        saved: created,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error('Save project toggle error:', error);
    return NextResponse.json({ error: 'Failed to update saved project.' }, { status: 500 });
  }
}
