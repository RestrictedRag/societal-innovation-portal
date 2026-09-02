import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { resolveAuthUser } from '@/lib/auth/resolve-user';

export async function GET() {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(null, { status: 200 });
    }

    const authResult = await resolveAuthUser();

    return NextResponse.json(
      {
        ...session,
        profile: authResult.success ? authResult.user : null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json(null, { status: 200 });
  }
}
