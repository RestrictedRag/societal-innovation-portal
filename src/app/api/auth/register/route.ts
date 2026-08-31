import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { signUpSchema } from '@/lib/validations/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = signUpSchema.parse(body);

    const {
      firstName,
      lastName,
      email,
      role,
      city,
      state,
      formattedAddress,
      country,
      latitude,
      longitude,
    } = validatedData;

    await db.insert(users).values({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      passwordHash: 'handled_by_neon_auth',
      role,
      city,
      state,
      formattedAddress,
      country,
      latitude,
      longitude,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Failed to create user profile' }, { status: 500 });
  }
}
