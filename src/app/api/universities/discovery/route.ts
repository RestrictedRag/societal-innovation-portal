import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { calculateProjectMatch } from '@/lib/ai/matching';

export async function GET() {
  try {
    const authResult = await requireRole(['STUDENT', 'FACULTY', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const universityId = user.universityId;

    // 1. Fetch Discovery Problems (OPEN or IN_PROGRESS, not yet claimed by THIS university)
    const discoveryProblems = await db.execute(sql`
      SELECT
        cp.id,
        cp.title,
        cp.description,
        cp.domain,
        cp.problem_type,
        cp.category,
        cp.subcategory,
        cp.status,
        cp.image_url,
        cp.created_at,
        (
          SELECT COUNT(*)::int
          FROM university_projects up
          WHERE up.problem_id = cp.id AND up.status = 'ACTIVE'
        ) AS active_claims_count,
        EXISTS (
          SELECT 1 FROM university_projects up
          WHERE up.problem_id = cp.id
            AND ${universityId ? sql`up.lead_university_id = ${universityId}` : sql`1=0`}
        ) AS claimed_by_my_university
      FROM citizen_problems cp
      WHERE cp.status IN ('OPEN', 'IN_PROGRESS')
      ORDER BY active_claims_count ASC, cp.created_at DESC
      LIMIT 40;
    `);

    // 2. Fetch My University's Active Claimed Projects
    const myProjects = await db.execute(sql`
      SELECT
        up.id AS project_id,
        up.problem_id,
        cp.title AS problem_title,
        cp.domain,
        up.project_type,
        up.health_status,
        up.status AS project_status,
        up.budget,
        u.name AS lead_university_name,
        up.last_activity_at,
        EXTRACT(DAY FROM (now() - up.last_activity_at))::int AS days_since_last_activity,
        up.created_at,
        COUNT(DISTINCT pu.id)::int AS total_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = false THEN pu.id END)::int AS unverified_milestones
      FROM university_projects up
      JOIN citizen_problems cp ON cp.id = up.problem_id
      JOIN universities u ON u.id = up.lead_university_id
      LEFT JOIN project_updates pu ON pu.project_id = up.id
      WHERE ${universityId ? sql`up.lead_university_id = ${universityId}` : sql`up.claimed_by_user_id = ${user.id}`}
      GROUP BY up.id, up.problem_id, cp.title, cp.domain, up.project_type, up.health_status, up.status, up.budget, u.name, up.last_activity_at, up.created_at
      ORDER BY up.created_at DESC;
    `);

    const getRows = (res: unknown) => (Array.isArray(res) ? res : ((res as any)?.rows as any[]) ?? []);

    const rawDiscovery = getRows(discoveryProblems);
    const rawMyProjects = getRows(myProjects);

    // Compute personalized match scores and explainability reasons for discovery problems
    const scoredDiscovery = rawDiscovery.map((p: any) => {
      const match = calculateProjectMatch(
        {
          id: p.id,
          title: p.title,
          description: p.description || '',
          domain: p.domain,
        },
        {
          role: user.role,
          department: user.department,
          skills: user.skills,
          interests: user.interests,
          expertise: user.expertise,
          preferredProjectType: user.preferredProjectType,
        },
      );

      return {
        ...p,
        matchScore: match.score,
        matchTier: match.matchTier,
        reasons: match.reasons,
      };
    });

    // Sort discovery: High-match first, then by active claims / recency
    scoredDiscovery.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const university = universityId
      ? await db.query.universities.findFirst({
          where: (u, { eq }) => eq(u.id, universityId),
        })
      : null;

    return NextResponse.json({
      university,
      userProfile: {
        department: user.department,
        yearOfStudy: user.yearOfStudy,
        skills: user.skills || [],
        interests: user.interests || [],
        expertise: user.expertise || [],
        preferredProjectType: user.preferredProjectType || 'BOTH',
      },
      isVerified: user.isVerified,
      role: user.role,
      discoveryProblems: scoredDiscovery,
      myProjects: rawMyProjects,
    });
  } catch (error: any) {
    console.error('University discovery error:', error);
    return NextResponse.json({ error: 'Failed to retrieve university dashboard data.' }, { status: 500 });
  }
}
