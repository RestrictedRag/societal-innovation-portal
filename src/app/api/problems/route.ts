import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Problems API ready',
    items: [],
  });
}

export async function POST() {
  return NextResponse.json({
    message: 'Problem creation endpoint ready',
  });
}
