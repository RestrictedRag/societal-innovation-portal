import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const { data, error } = await auth.signIn.email({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message || 'Invalid email or password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: data?.user ?? null }, { status: 200 });
  } catch (error) {
    console.error('Auth login route error:', error);
    return NextResponse.json({ error: 'Failed to sign in.' }, { status: 500 });
  }
}
