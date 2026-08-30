import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? 'Invalid login payload.',
        },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ message: 'Database is not configured.' }, { status: 500 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid email or password.' }, { status: 401 });
    }

    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({
      message: 'Login successful.',
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        message: 'Something went wrong while logging in.',
      },
      { status: 500 }
    );
  }
}
