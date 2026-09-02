import { NextResponse } from 'next/server';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  companyProfiles,
  industryCollaborations,
  projectPilots,
  escrowLedger,
} from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET() {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    // 1. Fetch Collaborations & Pilots for company
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
    });

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
    });

    const myEscrow = await db.query.escrowLedger.findMany({
      where: eq(escrowLedger.corporateId, user.id),
    });

    // Domain Breakdown
    const domainCounts: Record<string, number> = {};
    const domainSpend: Record<string, number> = {};

    myCollaborations.forEach((c) => {
      const d = c.project.problem.domain || 'urban_infrastructure';
      domainCounts[d] = (domainCounts[d] || 0) + 1;
      domainSpend[d] = (domainSpend[d] || 0) + Number(c.estimatedValue || 0);
    });

    myPilots.forEach((p) => {
      const d = p.project.problem.domain || 'urban_infrastructure';
      domainCounts[d] = (domainCounts[d] || 0) + 1;
    });

    const formattedDomainDistribution = Object.entries(domainCounts).map(([domain, count]) => ({
      domain: domain.replace(/_/g, ' '),
      rawDomain: domain,
      projectCount: count,
      allocatedCapital: domainSpend[domain] || 0,
    }));

    // KPI Aggregations
    const distinctProjectIds = new Set<string>();
    myCollaborations.forEach((c) => distinctProjectIds.add(c.projectId));
    myPilots.forEach((p) => distinctProjectIds.add(p.projectId));
    myEscrow.forEach((e) => distinctProjectIds.add(e.projectId));

    const totalProjectsSupported = distinctProjectIds.size;
    const activePilots = myPilots.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED').length;
    const completedPilots = myPilots.filter((p) => p.status === 'COMPLETED').length;

    const totalCommittedFunding = myEscrow.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalReleasedFunding = myEscrow
      .filter((e) => e.status === 'RELEASED')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const studentsSupported = totalProjectsSupported * 3 + activePilots * 2;
    const facultyCollaborators = totalProjectsSupported + activePilots;
    const citizensImpactedEstimate = totalProjectsSupported * 4500 + activePilots * 12000 + completedPilots * 25000;

    // Environmental / Social CSR Metrics
    const csrMetrics = [
      {
        title: 'Drinking Water Conserved',
        value: '1.2M Liters',
        domain: 'water_management',
        desc: 'Acoustic leak detection on Outer Ring Road corridor',
      },
      {
        title: 'Municipal Waste Diverted',
        value: '8.4 Tons',
        domain: 'waste_management',
        desc: 'Optical NIR classification at Sector 14 market',
      },
      {
        title: 'Urban Grid Carbon Offset',
        value: '14.2 Tons CO2e',
        domain: 'clean_energy',
        desc: 'Drone rooftop solar hotspot segmentation',
      },
      {
        title: 'Student R&D Internships Enabled',
        value: `${studentsSupported} Students`,
        domain: 'education',
        desc: 'Hands-on hardware & machine learning capstone deployments',
      },
    ];

    return NextResponse.json({
      summary: {
        totalProjectsSupported,
        activePilots,
        completedPilots,
        studentsSupported,
        facultyCollaborators,
        citizensImpactedEstimate,
        totalCommittedFunding,
        totalReleasedFunding,
      },
      domainDistribution: formattedDomainDistribution,
      csrMetrics,
      pilotsTimeline: myPilots.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        progressPercent: p.progressPercent,
        location: p.location,
        domain: p.project.problem.domain,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    });
  } catch (error: any) {
    console.error('Industry analytics error:', error);
    return NextResponse.json({ error: 'Failed to retrieve analytics data.' }, { status: 500 });
  }
}
