import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, companyProfiles } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET() {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    let profile = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, user.id),
    });

    if (!profile) {
      // Create initial company profile from user fields
      const [created] = await db
        .insert(companyProfiles)
        .values({
          userId: user.id,
          companyName: user.fullName || 'Industry Partner Org',
          companyType: 'Enterprise',
          industry: user.interests?.[0] || 'Smart Infrastructure',
          sector: 'Urban Technology & IoT',
          description: user.bio || 'Enterprise research & development collaborative partner.',
          location: `${user.city || 'New Delhi'}, ${user.state || 'Delhi'}`,
          areasOfExpertise: user.expertise || ['IoT', 'AI & Machine Learning', 'Sensors'],
          technologies: user.skills || ['Embedded C', 'Python', 'LoRaWAN', 'Cloud Analytics'],
          csrInterests: ['Water Conservation', 'Clean Energy', 'Waste Management'],
          innovationInterests: ['Edge Computing', 'Automated Sluices', 'Computer Vision'],
          preferredDomains: ['water_management', 'waste_management', 'clean_energy'],
          availableResources: ['Milestone Escrow Funding', 'Hardware Prototype Kits', 'Senior Mentorship', 'Live Municipal Testbeds'],
          fundingCapacity: '₹50,00,000 / annum',
          pilotLocations: ['Delhi NCR Corridor', 'Outer Ring Road', 'Gurugram Industrial Hub'],
          contactPersonName: `${user.firstName} ${user.lastName}`,
          contactEmail: user.email,
          contactPhone: '+91 98100 12345',
        })
        .returning();
      profile = created;
    }

    return NextResponse.json({ profile, user });
  } catch (error: any) {
    console.error('Company profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve company profile.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(['COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));

    const companyName = typeof body?.companyName === 'string' ? body.companyName.trim() : user.fullName;
    const companyType = typeof body?.companyType === 'string' ? body.companyType.trim() : null;
    const industry = typeof body?.industry === 'string' ? body.industry.trim() : null;
    const sector = typeof body?.sector === 'string' ? body.sector.trim() : null;
    const website = typeof body?.website === 'string' ? body.website.trim() : null;
    const description = typeof body?.description === 'string' ? body.description.trim() : null;
    const location = typeof body?.location === 'string' ? body.location.trim() : null;
    const areasOfExpertise = Array.isArray(body?.areasOfExpertise) ? body.areasOfExpertise : [];
    const technologies = Array.isArray(body?.technologies) ? body.technologies : [];
    const csrInterests = Array.isArray(body?.csrInterests) ? body.csrInterests : [];
    const innovationInterests = Array.isArray(body?.innovationInterests) ? body.innovationInterests : [];
    const preferredDomains = Array.isArray(body?.preferredDomains) ? body.preferredDomains : [];
    const availableResources = Array.isArray(body?.availableResources) ? body.availableResources : [];
    const fundingCapacity = typeof body?.fundingCapacity === 'string' ? body.fundingCapacity.trim() : null;
    const pilotLocations = Array.isArray(body?.pilotLocations) ? body.pilotLocations : [];
    const contactPersonName = typeof body?.contactPersonName === 'string' ? body.contactPersonName.trim() : null;
    const contactEmail = typeof body?.contactEmail === 'string' ? body.contactEmail.trim() : user.email;
    const contactPhone = typeof body?.contactPhone === 'string' ? body.contactPhone.trim() : null;

    const existing = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, user.id),
    });

    let updatedProfile;
    if (existing) {
      [updatedProfile] = await db
        .update(companyProfiles)
        .set({
          companyName,
          companyType,
          industry,
          sector,
          website,
          description,
          location,
          areasOfExpertise,
          technologies,
          csrInterests,
          innovationInterests,
          preferredDomains,
          availableResources,
          fundingCapacity,
          pilotLocations,
          contactPersonName,
          contactEmail,
          contactPhone,
          updatedAt: new Date(),
        })
        .where(eq(companyProfiles.id, existing.id))
        .returning();
    } else {
      [updatedProfile] = await db
        .insert(companyProfiles)
        .values({
          userId: user.id,
          companyName,
          companyType,
          industry,
          sector,
          website,
          description,
          location,
          areasOfExpertise,
          technologies,
          csrInterests,
          innovationInterests,
          preferredDomains,
          availableResources,
          fundingCapacity,
          pilotLocations,
          contactPersonName,
          contactEmail,
          contactPhone,
        })
        .returning();
    }

    return NextResponse.json({
      message: 'Company profile updated successfully.',
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error('Company profile update error:', error);
    return NextResponse.json({ error: 'Failed to update company profile.' }, { status: 500 });
  }
}
