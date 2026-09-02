import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { citizenProblems, problemMedia } from '@/db/schema';
import { POST as createProblemPostHandler } from '@/app/api/problems/create/route';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 20), 1), 100);
    const status = searchParams.get('status');

    const items = await db.query.citizenProblems.findMany({
      where: status ? eq(citizenProblems.status, status as any) : undefined,
      orderBy: [desc(citizenProblems.createdAt)],
      limit,
      with: {
        media: true,
      },
    });

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('Failed to fetch problems from database:', error);
    return NextResponse.json({ error: 'Failed to fetch problems.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return createProblemPostHandler(request);
}

