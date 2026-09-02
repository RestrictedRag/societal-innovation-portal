import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/lib/auth/server';

const registerProfileSchema = z
  .object({
    authUserId: z.string().trim().optional(),
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    email: z.string().trim().email('Please enter a valid email address.'),
    role: z.enum(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP'] as const),
    universityId: z.string().uuid().optional().nullable(),
    city: z.string().trim().min(1, 'City is required.'),
    state: z.string().trim().min(1, 'State is required.'),
    formattedAddress: z.string().trim().optional(),
    country: z.string().trim().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.role === 'STUDENT' || data.role === 'FACULTY') && !data.universityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['universityId'],
        message: 'University is required for students and faculty.',
      });
    }
  });

export async function POST(req: Request) {
  try {
    const { data: session } = await auth.getSession();
    const body = await req.json();
    const validatedData = registerProfileSchema.parse(body);

    const authUserId = session?.user?.id || validatedData.authUserId;
    if (!authUserId) {
      return NextResponse.json(
        { message: 'Authentication session not found. Please log in or sign up again.' },
        { status: 401 },
      );
    }

    const {
      firstName,
      lastName,
      email,
      role,
      universityId,
      city,
      state,
      formattedAddress,
      country,
      latitude,
      longitude,
    } = validatedData;

    await db.insert(users).values({
      authUserId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      role,
      universityId: role === 'STUDENT' || role === 'FACULTY' ? universityId : null,
      city,
      state,
      formattedAddress: formattedAddress ?? null,
      country: country ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    const cause = error?.cause ?? error;
    const pgCode = cause?.code || error?.code;
    const pgMessage = cause?.message || error?.message;
    const pgDetail = cause?.detail;
    const pgConstraint = cause?.constraint;

    console.error('Registration error details:', {
      name: error?.name,
      message: error?.message,
      pgCode,
      pgMessage,
      pgDetail,
      pgConstraint,
      stack: error?.stack,
      cause: error?.cause,
    });

    // Handle duplicate email (Postgres unique constraint violation)
    if (pgCode === '23505' || pgMessage?.includes('duplicate key') || error?.message?.includes('duplicate key')) {
      return NextResponse.json(
        { message: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    // Handle check constraint violations (e.g. university membership check)
    if (pgCode === '23514') {
      return NextResponse.json(
        { message: 'Invalid role and profile combination. Please check your details.' },
        { status: 400 },
      );
    }

    // Handle foreign key violations (e.g. invalid university ID)
    if (pgCode === '23503') {
      return NextResponse.json(
        { message: 'Selected university does not exist.' },
        { status: 400 },
      );
    }

    // Handle Zod validation errors
    if (error?.name === 'ZodError') {
      const firstIssue = error.issues?.[0];
      return NextResponse.json(
        { message: firstIssue?.message ?? 'Invalid registration data.' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: 'Failed to create user profile. Please try again.',
        error: process.env.NODE_ENV === 'development' ? pgMessage : undefined,
      },
      { status: 500 },
    );
  }
}

