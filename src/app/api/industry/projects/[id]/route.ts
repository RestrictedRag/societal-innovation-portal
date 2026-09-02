import { NextResponse } from 'next/server';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/db';
import {
  universityProjects,
  projectUpdates,
  escrowLedger,
  resourceOffers,
  industryCollaborations,
  projectPilots,
  savedProjects,
  companyProfiles,
  industryNeeds,
} from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';
import { calculateCompanyProjectMatch, type CompanyMatchProfile } from '@/lib/ai/matching';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const { id: projectId } = await context.params;

    const project = await db.query.universityProjects.findFirst({
      where: eq(universityProjects.id, projectId),
      with: {
        problem: {
          with: {
            user: {
              columns: {
                id: true,
                fullName: true,
                city: true,
                state: true,
              },
            },
            media: true,
          },
        },
        leadUniversity: true,
        claimedByUser: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            yearOfStudy: true,
            skills: true,
            interests: true,
            bio: true,
          },
        },
        updates: {
          orderBy: [desc(projectUpdates.trlLevel)],
          with: {
            verifier: {
              columns: {
                id: true,
                fullName: true,
                department: true,
                expertise: true,
              },
            },
          },
        },
        ledgers: {
          orderBy: [desc(escrowLedger.createdAt)],
          with: {
            corporate: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        resourceOffers: {
          orderBy: [desc(resourceOffers.createdAt)],
          with: {
            corporateUser: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        collaborations: {
          orderBy: [desc(industryCollaborations.createdAt)],
          with: {
            companyUser: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        pilots: {
          orderBy: [desc(projectPilots.createdAt)],
          with: {
            companyUser: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    // Check if saved by current user
    const saved = await db.query.savedProjects.findFirst({
      where: and(eq(savedProjects.userId, user.id), eq(savedProjects.projectId, projectId)),
    });

    // Compute company match score
    const profile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, user.id),
    });
    const userNeeds = await db.query.industryNeeds.findMany({
      where: eq(industryNeeds.companyUserId, user.id),
    });

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

    const maxTrl = project.updates.reduce((max, u) => Math.max(max, u.trlLevel), 1);
    const match = calculateCompanyProjectMatch(
      {
        id: project.id,
        title: project.problem.title,
        description: project.problem.description,
        domain: project.problem.domain,
        projectType: project.projectType,
        trlLevel: maxTrl,
        hasIndustryOffers: project.collaborations.length > 0 || project.pilots.length > 0,
      },
      matchProfile,
    );

    const totalEscrowHeld = project.ledgers
      .filter((l) => l.status === 'HELD')
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const totalEscrowReleased = project.ledgers
      .filter((l) => l.status === 'RELEASED')
      .reduce((sum, l) => sum + Number(l.amount || 0), 0);

    return NextResponse.json({
      project: {
        ...project,
        isSaved: Boolean(saved),
        maxTrl,
        totalEscrowHeld,
        totalEscrowReleased,
        matchScore: match.score,
        matchTier: match.matchTier,
        matchReasons: match.reasons,
      },
    });
  } catch (error: any) {
    console.error('Project detail fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve project details.' }, { status: 500 });
  }
}
