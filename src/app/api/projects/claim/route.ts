import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
  });

  if (!user || !user.isVerified) {
    return NextResponse.json({ error: 'User not found or unverified' }, { status: 403 });
  }

  if (user.role !== 'STUDENT' && user.role !== 'FACULTY') {
    return NextResponse.json({ error: 'Only students or faculty can claim projects' }, { status: 403 });
  }

  return NextResponse.json({
    message: 'Project claim endpoint ready',
  });
}
