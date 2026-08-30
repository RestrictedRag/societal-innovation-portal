import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { signUpSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = signUpSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? 'Invalid registration payload.',
        },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ message: 'Database is not configured.' }, { status: 500 });
    }

    const { firstName, lastName, email, password, role, city, state, latitude, longitude } = parsed.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (existingUser) {
      return NextResponse.json({ message: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [createdUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        fullName: `${firstName} ${lastName}`,
        role,
        city,
        state,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        city: users.city,
        state: users.state,
        latitude: users.latitude,
        longitude: users.longitude,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      });

    return NextResponse.json(
      {
        message: 'User registered successfully.',
        user: createdUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);

    return NextResponse.json(
      {
        message: 'Something went wrong while creating your account.',
      },
      { status: 500 }
    );
  }
}
