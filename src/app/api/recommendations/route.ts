import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Recommendations API ready',
    recommendations: [],
  });
}
