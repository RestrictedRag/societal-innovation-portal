import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/lib/auth/server';

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(null, { status: 200 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.authUserId, session.user.id),
      with: {
        university: true,
      },
    });

    return NextResponse.json(
      {
        ...session,
        profile: dbUser ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(null, { status: 200 });
  }
}
