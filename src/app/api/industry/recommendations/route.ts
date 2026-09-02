import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import { companyProfiles, industryNeeds, savedProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import {
  calculateCompanyProjectMatch,
  calculateCompanyProblemMatch,
  type CompanyMatchProfile,
} from '@/lib/ai/matching';

export async function GET() {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

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
      technologies: profile?.technologies || user.skills || ['Sensors', 'Embedded C', 'LoRaWAN'],
      csrInterests: profile?.csrInterests || ['Water Conservation', 'Clean Energy'],
      preferredDomains: profile?.preferredDomains || ['water_management', 'waste_management', 'clean_energy'],
      pilotLocations: profile?.pilotLocations || ['New Delhi', 'Outer Ring Road'],
      industryNeeds: userNeeds.map((n) => ({
        title: n.title,
        description: n.description,
        domain: n.domain,
        technology: n.technology,
      })),
    };

    // 1. Projects Query
    const projectsQuery = await db.execute(sql`
      SELECT
        up.id AS project_id,
        up.problem_id,
        cp.title AS problem_title,
        cp.description AS problem_description,
        cp.domain,
        cp.image_url,
        up.project_type,
        up.status AS project_status,
        up.budget,
        u.name AS lead_university_name,
        student.full_name AS student_name,
        student.skills AS student_skills,
        COALESCE(MAX(pu.trl_level), 1) AS max_trl_level,
        COUNT(DISTINCT pu.id)::int AS total_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones,
        COUNT(DISTINCT pp.id)::int AS pilot_count
      FROM university_projects up
      JOIN citizen_problems cp ON cp.id = up.problem_id
      JOIN universities u ON u.id = up.lead_university_id
      LEFT JOIN users student ON student.id = up.claimed_by_user_id
      LEFT JOIN project_updates pu ON pu.project_id = up.id
      LEFT JOIN project_pilots pp ON pp.project_id = up.id
      WHERE up.status = 'ACTIVE'
      GROUP BY
        up.id, up.problem_id, cp.title, cp.description, cp.domain, cp.image_url,
        up.project_type, up.status, up.budget, u.name,
        student.full_name, student.skills
      ORDER BY verified_milestones DESC;
    `);

    const rawProjectRows = Array.isArray(projectsQuery)
      ? projectsQuery
      : ((projectsQuery as any)?.rows as any[]) ?? [];

    const scoredProjects = rawProjectRows.map((p: any) => {
      const match = calculateCompanyProjectMatch(
        {
          id: p.project_id,
          title: p.problem_title,
          description: p.problem_description || '',
          domain: p.domain,
          projectType: p.project_type,
          trlLevel: p.max_trl_level,
          hasIndustryOffers: Number(p.pilot_count || 0) > 0,
        },
        matchProfile,
      );

      return {
        ...p,
        is_saved: savedProjectIds.has(p.project_id),
        matchScore: match.score,
        matchTier: match.matchTier,
        matchReasons: match.reasons,
      };
    });

    scoredProjects.sort((a, b) => b.matchScore - a.matchScore);

    // 2. Problems Query
    const problemsQuery = await db.execute(sql`
      SELECT
        cp.id,
        cp.title,
        cp.description,
        cp.domain,
        cp.category,
        cp.status,
        citizen.city AS reporter_city,
        COUNT(DISTINCT pu.id)::int AS upvotes_count
      FROM citizen_problems cp
      JOIN users citizen ON citizen.id = cp.user_id
      LEFT JOIN problem_upvotes pu ON pu.problem_id = cp.id
      WHERE cp.status IN ('OPEN', 'IN_PROGRESS')
      GROUP BY cp.id, cp.title, cp.description, cp.domain, cp.category, cp.status, citizen.city
      ORDER BY upvotes_count DESC
      LIMIT 15;
    `);

    const rawProblemRows = Array.isArray(problemsQuery)
      ? problemsQuery
      : ((problemsQuery as any)?.rows as any[]) ?? [];

    const scoredProblems = rawProblemRows.map((p: any) => {
      const match = calculateCompanyProblemMatch(
        {
          id: p.id,
          title: p.title,
          description: p.description,
          domain: p.domain,
          category: p.category,
          location: p.reporter_city,
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

    scoredProblems.sort((a, b) => b.matchScore - a.matchScore);

    // Dynamic Opportunity Insight Callouts
    const iotProjectsCount = scoredProjects.filter(
      (p) =>
        (p.student_skills || []).some((s: string) => s.toLowerCase().includes('iot')) ||
        p.problem_description?.toLowerCase().includes('iot') ||
        p.problem_description?.toLowerCase().includes('sensor'),
    ).length;

    const pilotReadyCount = scoredProjects.filter((p) => (p.max_trl_level || 1) >= 4).length;
    const researchCount = scoredProjects.filter((p) => p.project_type === 'RESEARCH').length;

    const insights = [
      `${pilotReadyCount} university project${pilotReadyCount === 1 ? ' is' : 's are'} at TRL 4+ and ready for pilot deployment.`,
      `${iotProjectsCount} project${iotProjectsCount === 1 ? '' : 's'} align with your IoT & Embedded sensor expertise.`,
      `${researchCount} academic research initiative${researchCount === 1 ? '' : 's'} match your innovation interests.`,
    ];

    return NextResponse.json({
      insights,
      recommendedProjects: scoredProjects.slice(0, 8),
      recommendedProblems: scoredProblems.slice(0, 6),
    });
  } catch (error: any) {
    console.error('Industry recommendations error:', error);
    return NextResponse.json({ error: 'Failed to retrieve recommendations.' }, { status: 500 });
  }
}
