import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import { companyProfiles } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { calculateCompanyProblemMatch, type CompanyMatchProfile } from '@/lib/ai/matching';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const domainFilter = searchParams.get('domain');
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase() || '';

    // Fetch company profile for scoring
    const profile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, user.id),
    });

    const matchProfile: CompanyMatchProfile = {
      companyName: profile?.companyName || user.fullName,
      industry: profile?.industry || user.interests?.[0] || 'Smart Infrastructure',
      areasOfExpertise: profile?.areasOfExpertise || user.expertise || ['IoT', 'AI'],
      technologies: profile?.technologies || user.skills || ['Sensors', 'Embedded C'],
      csrInterests: profile?.csrInterests || ['Water Conservation', 'Sustainability'],
      preferredDomains: profile?.preferredDomains || ['water_management', 'waste_management', 'clean_energy'],
      pilotLocations: profile?.pilotLocations || ['New Delhi', 'Outer Ring Road'],
    };

    const problemsQuery = await db.execute(sql`
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
        cp.latitude,
        cp.longitude,
        cp.created_at,
        citizen.full_name AS reporter_name,
        citizen.city AS reporter_city,
        citizen.state AS reporter_state,
        COUNT(DISTINCT pu.id)::int AS upvote_count,
        COUNT(DISTINCT up.id)::int AS active_projects_count,
        EXISTS (
          SELECT 1 FROM university_projects up2
          JOIN project_pilots pp ON pp.project_id = up2.id
          WHERE up2.problem_id = cp.id
        ) AS has_active_pilot
      FROM citizen_problems cp
      JOIN users citizen ON citizen.id = cp.user_id
      LEFT JOIN problem_upvotes pu ON pu.problem_id = cp.id
      LEFT JOIN university_projects up ON up.problem_id = cp.id AND up.status = 'ACTIVE'
      WHERE cp.status IN ('OPEN', 'IN_PROGRESS', 'NEEDS_REVIEW')
      GROUP BY
        cp.id, cp.title, cp.description, cp.domain, cp.problem_type, cp.category, cp.subcategory,
        cp.status, cp.image_url, cp.latitude, cp.longitude, cp.created_at,
        citizen.full_name, citizen.city, citizen.state
      ORDER BY active_projects_count DESC, upvote_count DESC, cp.created_at DESC;
    `);

    const rawRows = Array.isArray(problemsQuery)
      ? problemsQuery
      : ((problemsQuery as any)?.rows as any[]) ?? [];

    let scoredProblems = rawRows.map((p: any) => {
      const match = calculateCompanyProblemMatch(
        {
          id: p.id,
          title: p.title,
          description: p.description,
          domain: p.domain,
          category: p.category,
          subcategory: p.subcategory,
          location: `${p.reporter_city || ''} ${p.reporter_state || ''}`,
        },
        matchProfile,
      );

      return {
        ...p,
        matchScore: match.score,
        matchTier: match.matchTier,
        matchReasons: match.reasons,
      };
    });

    if (domainFilter && domainFilter !== 'ALL') {
      scoredProblems = scoredProblems.filter((p) => p.domain === domainFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      scoredProblems = scoredProblems.filter((p) => p.status === statusFilter);
    }
    if (search) {
      scoredProblems = scoredProblems.filter(
        (p) =>
          p.title?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.category?.toLowerCase().includes(search) ||
          p.reporter_city?.toLowerCase().includes(search),
      );
    }

    return NextResponse.json({
      problems: scoredProblems,
      total: scoredProblems.length,
    });
  } catch (error: any) {
    console.error('Industry problems fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve civic problems.' }, { status: 500 });
  }
}
