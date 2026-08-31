import { NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { universities } from '@/db/schema';

export async function GET() {
  try {
    const list = await db
      .select({
        id: universities.id,
        name: universities.name,
        isVerified: universities.isVerified,
      })
      .from(universities)
      .orderBy(asc(universities.name));

    return NextResponse.json({ universities: list }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch universities:', error);
    return NextResponse.json({ message: 'Failed to fetch universities.', universities: [] }, { status: 500 });
  }
}
