import { NextResponse } from 'next/server';
import { sql, eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import {
  users,
  companyProfiles,
  industryNeeds,
  industryCollaborations,
  projectPilots,
  escrowLedger,
  savedProjects,
  universityProjects,
} from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { calculateCompanyProjectMatch, type CompanyMatchProfile } from '@/lib/ai/matching';

export async function GET() {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    // 1. Fetch Company Profile
    const profile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, user.id),
    });

    // 2. Fetch User's Industry Needs
    const myNeeds = await db.query.industryNeeds.findMany({
      where: eq(industryNeeds.companyUserId, user.id),
      orderBy: [desc(industryNeeds.createdAt)],
    });

    // 3. Fetch Collaborations
    const myCollaborations = await db.query.industryCollaborations.findMany({
      where: eq(industryCollaborations.companyUserId, user.id),
      with: {
        project: {
          with: {
            problem: true,
            leadUniversity: true,
          },
        },
      },
      orderBy: [desc(industryCollaborations.createdAt)],
    });

    // 4. Fetch Pilots
    const myPilots = await db.query.projectPilots.findMany({
      where: eq(projectPilots.companyUserId, user.id),
      with: {
        project: {
          with: {
            problem: true,
            leadUniversity: true,
          },
        },
      },
      orderBy: [desc(projectPilots.createdAt)],
    });

    // 5. Fetch Escrow Disbursals
    const myEscrow = await db.query.escrowLedger.findMany({
      where: eq(escrowLedger.corporateId, user.id),
    });

    // 6. Fetch Saved Projects Count
    const mySaved = await db.query.savedProjects.findMany({
      where: eq(savedProjects.userId, user.id),
    });

    // 7. Aggregated KPI Calculations
    const activeCollaborations = myCollaborations.filter(
      (c) => c.status === 'ACCEPTED' || c.status === 'IN_PROGRESS',
    ).length;
    const pendingProposals = myCollaborations.filter((c) => c.status === 'PROPOSED').length;

    const activePilots = myPilots.filter(
      (p) => p.status === 'ACTIVE' || p.status === 'APPROVED' || p.status === 'PLANNED',
    ).length;
    const completedPilots = myPilots.filter((p) => p.status === 'COMPLETED').length;

    const totalFundingCommitted = myEscrow.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalFundingReleased = myEscrow
      .filter((item) => item.status === 'RELEASED')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const distinctProjectIds = new Set<string>();
    myCollaborations.forEach((c) => distinctProjectIds.add(c.projectId));
    myPilots.forEach((p) => distinctProjectIds.add(p.projectId));
    myEscrow.forEach((e) => distinctProjectIds.add(e.projectId));

    const projectsSupportedCount = distinctProjectIds.size;

    // Approximate students and faculty connected
    const studentsConnectedCount = projectsSupportedCount * 3 + activePilots * 2;
    const facultyConnectedCount = projectsSupportedCount + activePilots;
    const solutionsDeployedCount = completedPilots;

    // 8. Fetch Top 4 Recommended Projects
    const matchProfile: CompanyMatchProfile = {
      companyName: profile?.companyName || user.fullName,
      industry: profile?.industry || user.interests?.[0] || 'Smart Infrastructure',
      areasOfExpertise: profile?.areasOfExpertise || user.expertise || ['IoT', 'AI'],
      technologies: profile?.technologies || user.skills || ['Sensors', 'Embedded'],
      csrInterests: profile?.csrInterests || ['Sustainability', 'Water', 'Clean Energy'],
      preferredDomains: profile?.preferredDomains || ['water_management', 'waste_management', 'clean_energy'],
      industryNeeds: myNeeds.map((n) => ({
        title: n.title,
        description: n.description,
        domain: n.domain,
        technology: n.technology,
      })),
    };

    const allActiveProjects = await db.execute(sql`
      SELECT
        up.id AS project_id,
        up.problem_id,
        cp.title AS problem_title,
        cp.description AS problem_description,
        cp.domain,
        up.project_type,
        up.status AS project_status,
        up.health_status,
        up.budget,
        u.name AS lead_university_name,
        COALESCE(MAX(pu.trl_level), 1) AS max_trl_level,
        COUNT(DISTINCT pu.id)::int AS total_milestones,
        COUNT(DISTINCT CASE WHEN pu.verified = true THEN pu.id END)::int AS verified_milestones
      FROM university_projects up
      JOIN citizen_problems cp ON cp.id = up.problem_id
      JOIN universities u ON u.id = up.lead_university_id
      LEFT JOIN project_updates pu ON pu.project_id = up.id
      WHERE up.status = 'ACTIVE'
      GROUP BY up.id, up.problem_id, cp.title, cp.description, cp.domain, up.project_type, up.status, up.health_status, up.budget, u.name
      LIMIT 20;
    `);

    const rawProjectRows = Array.isArray(allActiveProjects)
      ? allActiveProjects
      : ((allActiveProjects as any)?.rows as any[]) ?? [];

    const scoredRecommendations = rawProjectRows.map((p: any) => {
      const match = calculateCompanyProjectMatch(
        {
          id: p.project_id,
          title: p.problem_title,
          description: p.problem_description || '',
          domain: p.domain,
          projectType: p.project_type,
          trlLevel: p.max_trl_level,
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

    scoredRecommendations.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      profile: profile || {
        companyName: user.fullName || 'Demo Industry Partner',
        industry: 'Smart Infrastructure & Urban Tech',
        description: user.bio || 'Enterprise innovation partner collaborating with university labs.',
      },
      kpis: {
        activeCollaborations,
        pendingProposals,
        projectsSupported: projectsSupportedCount,
        activePilots,
        completedPilots,
        fundingCommitted: totalFundingCommitted,
        fundingReleased: totalFundingReleased,
        studentsConnected: studentsConnectedCount,
        facultyConnected: facultyConnectedCount,
        solutionsDeployed: solutionsDeployedCount,
        savedProjectsCount: mySaved.length,
        openNeedsCount: myNeeds.filter((n) => n.status === 'OPEN').length,
      },
      topRecommendations: scoredRecommendations.slice(0, 4),
      recentCollaborations: myCollaborations.slice(0, 4),
      recentPilots: myPilots.slice(0, 4),
    });
  } catch (error: any) {
    console.error('Industry dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve industry dashboard data.' }, { status: 500 });
  }
}
