import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function GET() {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const fullProfile = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      with: {
        university: true,
      },
    });

    return NextResponse.json({ profile: fullProfile });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve profile.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;

    const body = await request.json().catch(() => ({}));
    const department = typeof body?.department === 'string' ? body.department.trim() : undefined;
    const yearOfStudy = typeof body?.yearOfStudy === 'number' ? body.yearOfStudy : undefined;
    const skills = Array.isArray(body?.skills) ? body.skills.filter((s: unknown) => typeof s === 'string') : undefined;
    const interests = Array.isArray(body?.interests) ? body.interests.filter((i: unknown) => typeof i === 'string') : undefined;
    const expertise = Array.isArray(body?.expertise) ? body.expertise.filter((e: unknown) => typeof e === 'string') : undefined;
    const preferredProjectType = typeof body?.preferredProjectType === 'string' ? body.preferredProjectType.trim() : undefined;
    const bio = typeof body?.bio === 'string' ? body.bio.trim() : undefined;

    const updateData: Record<string, any> = {};
    if (department !== undefined) updateData.department = department;
    if (yearOfStudy !== undefined) updateData.yearOfStudy = yearOfStudy;
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (preferredProjectType !== undefined) updateData.preferredProjectType = preferredProjectType;
    if (bio !== undefined) updateData.bio = bio;

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updatedUser,
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
