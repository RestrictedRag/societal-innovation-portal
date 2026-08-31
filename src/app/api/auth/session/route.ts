import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth/server';

export async function GET() {
  const { data: session } = await auth.getSession();
  return NextResponse.json(session ?? null, { status: 200 });
}
