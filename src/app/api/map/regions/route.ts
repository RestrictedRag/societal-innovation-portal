import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { auth } from '@/lib/auth/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedRegion = searchParams.get('region')?.trim() || null;

    // Optional user session (for viewing own PENDING_MODERATION submissions)
    const { data: session } = await auth.getSession();
    const sessionUserId = session?.user?.id || null;

    // 1. Regional Aggregations Query with Domain Breakdown Subquery
    const regionsResult = await db.execute(sql`
      WITH scoped_problems AS (
        SELECT
          cp.id,
          cp.title,
          cp.status,
          COALESCE(cp.domain::text, 'other') AS domain,
          cp.latitude,
          cp.longitude,
          COALESCE(u.city, 'General Region') AS region_name
        FROM citizen_problems cp
        LEFT JOIN users u ON u.id = cp.user_id
        WHERE cp.latitude IS NOT NULL AND cp.longitude IS NOT NULL
          AND (
            cp.status != 'PENDING_MODERATION'
            OR (${sessionUserId}::text IS NOT NULL AND u.auth_user_id = ${sessionUserId})
          )
      ),
      domain_counts AS (
        SELECT
          region_name,
          domain,
          COUNT(*)::int AS count
        FROM scoped_problems
        GROUP BY region_name, domain
      ),
      domain_json AS (
        SELECT
          region_name,
          JSONB_OBJECT_AGG(domain, count) AS domains_breakdown
        FROM domain_counts
        GROUP BY region_name
      )
      SELECT
        sp.region_name,
        ROUND(AVG(sp.latitude)::numeric, 4)::float AS center_lat,
        ROUND(AVG(sp.longitude)::numeric, 4)::float AS center_lng,
        COUNT(DISTINCT sp.id)::int AS total_problems,
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'OPEN')::int AS open_count,
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'IN_PROGRESS')::int AS in_progress_count,
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'CLAIMED')::int AS claimed_count,
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'PENDING_MODERATION')::int AS pending_count,
        COALESCE(dj.domains_breakdown, '{}'::jsonb) AS domains_breakdown
      FROM scoped_problems sp
      LEFT JOIN domain_json dj ON dj.region_name = sp.region_name
      GROUP BY sp.region_name, dj.domains_breakdown
      ORDER BY total_problems DESC;
    `);

    const regions = Array.isArray(regionsResult)
      ? regionsResult
      : ((regionsResult as any)?.rows as any[]) ?? [];

    // 2. Fetch Detailed Problem List (optionally filtered by region)
    const problemsQuery = selectedRegion
      ? sql`
          SELECT
            cp.id,
            cp.title,
            cp.description,
            COALESCE(cp.domain::text, 'other') AS domain,
            cp.status,
            cp.image_url,
            cp.latitude,
            cp.longitude,
            cp.created_at,
            COALESCE(u.city, 'General Region') AS region_name,
            u.full_name AS author_name,
            COUNT(DISTINCT up.id)::int AS active_claims_count
          FROM citizen_problems cp
          LEFT JOIN users u ON u.id = cp.user_id
          LEFT JOIN university_projects up ON up.problem_id = cp.id AND up.status = 'ACTIVE'
          WHERE cp.latitude IS NOT NULL AND cp.longitude IS NOT NULL
            AND COALESCE(u.city, 'General Region') = ${selectedRegion}
            AND (
              cp.status != 'PENDING_MODERATION'
              OR (${sessionUserId}::text IS NOT NULL AND u.auth_user_id = ${sessionUserId})
            )
          GROUP BY cp.id, cp.title, cp.description, cp.domain, cp.status, cp.image_url, cp.latitude, cp.longitude, cp.created_at, u.city, u.full_name
          ORDER BY cp.created_at DESC
          LIMIT 200;
        `
      : sql`
          SELECT
            cp.id,
            cp.title,
            cp.description,
            COALESCE(cp.domain::text, 'other') AS domain,
            cp.status,
            cp.image_url,
            cp.latitude,
            cp.longitude,
            cp.created_at,
            COALESCE(u.city, 'General Region') AS region_name,
            u.full_name AS author_name,
            COUNT(DISTINCT up.id)::int AS active_claims_count
          FROM citizen_problems cp
          LEFT JOIN users u ON u.id = cp.user_id
          LEFT JOIN university_projects up ON up.problem_id = cp.id AND up.status = 'ACTIVE'
          WHERE cp.latitude IS NOT NULL AND cp.longitude IS NOT NULL
            AND (
              cp.status != 'PENDING_MODERATION'
              OR (${sessionUserId}::text IS NOT NULL AND u.auth_user_id = ${sessionUserId})
            )
          GROUP BY cp.id, cp.title, cp.description, cp.domain, cp.status, cp.image_url, cp.latitude, cp.longitude, cp.created_at, u.city, u.full_name
          ORDER BY cp.created_at DESC
          LIMIT 200;
        `;

    const problemsResult = await db.execute(problemsQuery);
    const problems = Array.isArray(problemsResult)
      ? problemsResult
      : ((problemsResult as any)?.rows as any[]) ?? [];

    // 3. Compute Platform-Wide Totals
    const platformTotals = {
      totalProblems: regions.reduce((acc: number, r: any) => acc + (Number(r.total_problems) || 0), 0),
      openCount: regions.reduce((acc: number, r: any) => acc + (Number(r.open_count) || 0), 0),
      inProgressCount: regions.reduce((acc: number, r: any) => acc + (Number(r.in_progress_count) || 0), 0),
      claimedCount: regions.reduce((acc: number, r: any) => acc + (Number(r.claimed_count) || 0), 0),
      pendingCount: regions.reduce((acc: number, r: any) => acc + (Number(r.pending_count) || 0), 0),
      totalRegions: regions.length,
    };

    return NextResponse.json({
      regions,
      problems,
      platformTotals,
      selectedRegion,
    });
  } catch (error: any) {
    console.error('Regional map data fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve regional map data.' }, { status: 500 });
  }
}
