import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { calculateProjectMatch } from '@/lib/ai/matching';

export async function GET() {
  try {
    const authResult = await requireRole(['FACULTY', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const universityId = user.universityId;

    // Fetch projects under this university with health metrics and unverified milestone counts
    const healthRows = await db.execute(sql`
      SELECT
        up.id AS project_id,
        up.problem_id,
        cp.title AS problem_title,
        cp.description AS problem_description,
        cp.domain,
        up.project_type,
        up.status,
        up.health_status,
        up.budget,
        u.name AS lead_university_name,
        up.last_activity_at,
        EXTRACT(DAY FROM (now() - up.last_activity_at))::int AS days_since_last_activity,
        COUNT(DISTINCT pu.id)::int AS total_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = false THEN pu.id END)::int AS unverified_milestones
      FROM university_projects up
      JOIN citizen_problems cp ON cp.id = up.problem_id
      JOIN universities u ON u.id = up.lead_university_id
      LEFT JOIN project_updates pu ON pu.project_id = up.id
      WHERE ${universityId ? sql`up.lead_university_id = ${universityId}` : sql`1=1`}
      GROUP BY up.id, up.problem_id, cp.title, cp.description, cp.domain, up.project_type, up.status, up.health_status, up.budget, u.name, up.last_activity_at
      ORDER BY unverified_milestones DESC, up.last_activity_at DESC;
    `);

    const getRows = (res: unknown) => (Array.isArray(res) ? res : ((res as any)?.rows as any[]) ?? []);
    const rawProjects = getRows(healthRows);

    // Compute dynamic health status & match reasons
    const processed = rawProjects.map((p: any) => {
      const days = Number(p.days_since_last_activity || 0);
      let calculatedHealth: 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK' = 'HEALTHY';

      if (days > 21) {
        calculatedHealth = 'AT_RISK';
      } else if (days > 14 || p.unverified_milestones > 0) {
        calculatedHealth = 'NEEDS_ATTENTION';
      }

      const match = calculateProjectMatch(
        {
          id: p.project_id,
          title: p.problem_title,
          description: p.problem_description || '',
          domain: p.domain,
          projectType: p.project_type,
        },
        {
          role: user.role,
          department: user.department,
          expertise: user.expertise,
          interests: user.interests,
        },
      );

      return {
        ...p,
        health_status: calculatedHealth,
        days_since_last_activity: days,
        matchScore: match.score,
        matchTier: match.matchTier,
        reasons: match.reasons,
      };
    });

    return NextResponse.json({ projects: processed });
  } catch (error: any) {
    console.error('Faculty health query error:', error);
    return NextResponse.json({ error: 'Failed to retrieve faculty health diagnostics.' }, { status: 500 });
  }
}
