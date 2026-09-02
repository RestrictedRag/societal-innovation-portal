import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status')?.trim() || null;

    // Fetch user's problems with active claims and media
    const problemsQuery = statusParam
      ? sql`
          SELECT
            cp.id,
            cp.client_id,
            cp.title,
            cp.description,
            COALESCE(cp.domain::text, 'other') AS domain,
            cp.status::text AS status,
            cp.image_url,
            cp.spam_score,
            cp.latitude,
            cp.longitude,
            cp.created_at,
            cp.updated_at,
            COUNT(DISTINCT up.id)::int AS active_claims_count,
            COALESCE(
              JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', up.id, 'lead_university_name', u.name, 'status', up.status, 'budget', up.budget))
              FILTER (WHERE up.id IS NOT NULL),
              '[]'::jsonb
            ) AS university_claims
          FROM citizen_problems cp
          LEFT JOIN university_projects up ON up.problem_id = cp.id
          LEFT JOIN universities u ON u.id = up.lead_university_id
          WHERE cp.user_id = ${user.id}::uuid
            AND cp.status::text = ${statusParam}
          GROUP BY cp.id, cp.client_id, cp.title, cp.description, cp.domain, cp.status, cp.image_url, cp.spam_score, cp.latitude, cp.longitude, cp.created_at, cp.updated_at
          ORDER BY cp.created_at DESC;
        `
      : sql`
          SELECT
            cp.id,
            cp.client_id,
            cp.title,
            cp.description,
            COALESCE(cp.domain::text, 'other') AS domain,
            cp.status::text AS status,
            cp.image_url,
            cp.spam_score,
            cp.latitude,
            cp.longitude,
            cp.created_at,
            cp.updated_at,
            COUNT(DISTINCT up.id)::int AS active_claims_count,
            COALESCE(
              JSONB_AGG(DISTINCT JSONB_BUILD_OBJECT('id', up.id, 'lead_university_name', u.name, 'status', up.status, 'budget', up.budget))
              FILTER (WHERE up.id IS NOT NULL),
              '[]'::jsonb
            ) AS university_claims
          FROM citizen_problems cp
          LEFT JOIN university_projects up ON up.problem_id = cp.id
          LEFT JOIN universities u ON u.id = up.lead_university_id
          WHERE cp.user_id = ${user.id}::uuid
          GROUP BY cp.id, cp.client_id, cp.title, cp.description, cp.domain, cp.status, cp.image_url, cp.spam_score, cp.latitude, cp.longitude, cp.created_at, cp.updated_at
          ORDER BY cp.created_at DESC;
        `;

    const problemsResult = await db.execute(problemsQuery);
    const problems = Array.isArray(problemsResult)
      ? problemsResult
      : ((problemsResult as any)?.rows as any[]) ?? [];

    // Compute status counts for user's problems using valid enum values
    const countsResult = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status::text IN ('PENDING', 'PENDING_MODERATION'))::int AS pending_moderation,
        COUNT(*) FILTER (WHERE status::text = 'OPEN')::int AS open,
        COUNT(*) FILTER (WHERE status::text = 'IN_PROGRESS')::int AS in_progress,
        COUNT(*) FILTER (WHERE status::text = 'CLAIMED')::int AS claimed,
        COUNT(*) FILTER (WHERE status::text = 'MERGED')::int AS merged,
        COUNT(*) FILTER (WHERE status::text = 'NEEDS_REVIEW')::int AS needs_review,
        COUNT(*) FILTER (WHERE status::text = 'REJECTED')::int AS rejected
      FROM citizen_problems
      WHERE user_id = ${user.id}::uuid;
    `);

    const countsRow = Array.isArray(countsResult)
      ? countsResult[0]
      : ((countsResult as any)?.rows?.[0] as any) ?? {};

    return NextResponse.json({
      problems,
      count: problems.length,
      totals: {
        total: Number(countsRow?.total) || 0,
        pendingModeration: Number(countsRow?.pending_moderation) || 0,
        open: Number(countsRow?.open) || 0,
        inProgress: Number(countsRow?.in_progress) || 0,
        claimed: Number(countsRow?.claimed) || 0,
        merged: Number(countsRow?.merged) || 0,
        needsReview: Number(countsRow?.needs_review) || 0,
        rejected: Number(countsRow?.rejected) || 0,
      },
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch user problems:', error);
    return NextResponse.json({ error: error?.message || 'Failed to retrieve submitted problems.' }, { status: 500 });
  }
}
