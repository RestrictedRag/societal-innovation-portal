import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

export async function GET() {
  try {
    const showcaseProjects = await db.execute(sql`
      SELECT
        up.id AS project_id,
        up.problem_id,
        cp.title AS problem_title,
        cp.description AS problem_description,
        cp.domain,
        cp.image_url,
        up.status AS project_status,
        up.budget,
        u.name AS lead_university_name,
        COUNT(DISTINCT pu.id)::int AS total_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones,
        MAX(pu.trl_level) AS max_trl_level,
        COALESCE(SUM(CASE WHEN el.status = 'HELD' THEN el.amount ELSE 0 END), 0)::text AS held_escrow,
        COALESCE(SUM(CASE WHEN el.status = 'RELEASED' THEN el.amount ELSE 0 END), 0)::text AS released_escrow
      FROM university_projects up
      JOIN citizen_problems cp ON cp.id = up.problem_id
      JOIN universities u ON u.id = up.lead_university_id
      LEFT JOIN project_updates pu ON pu.project_id = up.id
      LEFT JOIN escrow_ledger el ON el.project_id = up.id
      WHERE up.status = 'ACTIVE'
      GROUP BY up.id, up.problem_id, cp.title, cp.description, cp.domain, cp.image_url, up.status, up.budget, u.name
      ORDER BY verified_milestones DESC, up.created_at DESC;
    `);

    const rows = Array.isArray(showcaseProjects)
      ? showcaseProjects
      : ((showcaseProjects as any)?.rows as any[]) ?? [];

    return NextResponse.json({ projects: rows });
  } catch (error: any) {
    console.error('Showcase fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve corporate showcase projects.' }, { status: 500 });
  }
}
