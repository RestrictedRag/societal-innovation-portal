import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import { companyProfiles, industryNeeds, savedProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { calculateCompanyProjectMatch, type CompanyMatchProfile } from '@/lib/ai/matching';

export async function GET(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const { searchParams } = new URL(request.url);
    const projectTypeFilter = searchParams.get('projectType'); // 'RESEARCH', 'PROBLEM_SOLVING', 'ALL'
    const domainFilter = searchParams.get('domain');
    const minTrlFilter = searchParams.get('minTrl') ? Number(searchParams.get('minTrl')) : null;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const universityIdFilter = searchParams.get('universityId');

    // 1. Fetch user's company profile and needs for matching
    const profile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, user.id),
    });

    const userNeeds = await db.query.industryNeeds.findMany({
      where: eq(industryNeeds.companyUserId, user.id),
    });

    const mySaved = await db.query.savedProjects.findMany({
      where: eq(savedProjects.userId, user.id),
    });
    const savedProjectIds = new Set(mySaved.map((s) => s.projectId));

    const matchProfile: CompanyMatchProfile = {
      companyName: profile?.companyName || user.fullName,
      industry: profile?.industry || user.interests?.[0] || 'Smart Infrastructure',
      areasOfExpertise: profile?.areasOfExpertise || user.expertise || ['IoT', 'AI'],
      technologies: profile?.technologies || user.skills || ['Sensors', 'Embedded C'],
      csrInterests: profile?.csrInterests || ['Water Conservation', 'Sustainability'],
      preferredDomains: profile?.preferredDomains || ['water_management', 'waste_management', 'clean_energy'],
      industryNeeds: userNeeds.map((n) => ({
        title: n.title,
        description: n.description,
        domain: n.domain,
        technology: n.technology,
      })),
    };

    // 2. Query all active university projects with relations
    const projectsQuery = await db.execute(sql`
      SELECT
        up.id AS project_id,
        up.problem_id,
        cp.title AS problem_title,
        cp.description AS problem_description,
        cp.domain,
        cp.image_url,
        cp.problem_type,
        cp.category,
        cp.subcategory,
        up.project_type,
        up.status AS project_status,
        up.health_status,
        up.budget,
        up.last_activity_at,
        up.created_at,
        u.id AS lead_university_id,
        u.name AS lead_university_name,
        u.location AS lead_university_location,
        u.service_radius_km,
        student.id AS student_user_id,
        student.full_name AS student_name,
        student.email AS student_email,
        student.department AS student_department,
        student.skills AS student_skills,
        student.bio AS student_bio,
        COALESCE(MAX(pu.trl_level), 1) AS max_trl_level,
        COUNT(DISTINCT pu.id)::int AS total_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones,
        COALESCE(SUM(CASE WHEN el.status = 'HELD' THEN el.amount ELSE 0 END), 0)::text AS held_escrow,
        COALESCE(SUM(CASE WHEN el.status = 'RELEASED' THEN el.amount ELSE 0 END), 0)::text AS released_escrow,
        COUNT(DISTINCT pp.id)::int AS pilot_count,
        COUNT(DISTINCT ic.id)::int AS collaboration_count
      FROM university_projects up
      JOIN citizen_problems cp ON cp.id = up.problem_id
      JOIN universities u ON u.id = up.lead_university_id
      LEFT JOIN users student ON student.id = up.claimed_by_user_id
      LEFT JOIN project_updates pu ON pu.project_id = up.id
      LEFT JOIN escrow_ledger el ON el.project_id = up.id
      LEFT JOIN project_pilots pp ON pp.project_id = up.id
      LEFT JOIN industry_collaborations ic ON ic.project_id = up.id
      WHERE up.status = 'ACTIVE'
      GROUP BY
        up.id, up.problem_id, cp.title, cp.description, cp.domain, cp.image_url, cp.problem_type, cp.category, cp.subcategory,
        up.project_type, up.status, up.health_status, up.budget, up.last_activity_at, up.created_at,
        u.id, u.name, u.location, u.service_radius_km,
        student.id, student.full_name, student.email, student.department, student.skills, student.bio
      ORDER BY verified_milestones DESC, up.created_at DESC;
    `);

    const rawRows = Array.isArray(projectsQuery)
      ? projectsQuery
      : ((projectsQuery as any)?.rows as any[]) ?? [];

    let filteredProjects = rawRows.map((p: any) => {
      const match = calculateCompanyProjectMatch(
        {
          id: p.project_id,
          title: p.problem_title,
          description: p.problem_description || '',
          domain: p.domain,
          projectType: p.project_type,
          trlLevel: p.max_trl_level,
          hasIndustryOffers: Number(p.collaboration_count || 0) > 0 || Number(p.pilot_count || 0) > 0,
        },
        matchProfile,
      );

      return {
        ...p,
        is_saved: savedProjectIds.has(p.project_id),
        match_score: match.score,
        match_tier: match.matchTier,
        match_reasons: match.reasons,
      };
    });

    // Apply filters
    if (projectTypeFilter && projectTypeFilter !== 'ALL') {
      filteredProjects = filteredProjects.filter((p) => p.project_type === projectTypeFilter);
    }
    if (domainFilter && domainFilter !== 'ALL') {
      filteredProjects = filteredProjects.filter((p) => p.domain === domainFilter);
    }
    if (minTrlFilter !== null && minTrlFilter > 1) {
      filteredProjects = filteredProjects.filter((p) => (p.max_trl_level || 1) >= minTrlFilter);
    }
    if (universityIdFilter) {
      filteredProjects = filteredProjects.filter((p) => p.lead_university_id === universityIdFilter);
    }
    if (search) {
      filteredProjects = filteredProjects.filter(
        (p) =>
          p.problem_title?.toLowerCase().includes(search) ||
          p.problem_description?.toLowerCase().includes(search) ||
          p.lead_university_name?.toLowerCase().includes(search) ||
          (p.student_skills || []).some((s: string) => s.toLowerCase().includes(search)),
      );
    }

    return NextResponse.json({
      projects: filteredProjects,
      total: filteredProjects.length,
    });
  } catch (error: any) {
    console.error('Industry projects discovery error:', error);
    return NextResponse.json({ error: 'Failed to retrieve industry projects.' }, { status: 500 });
  }
}
