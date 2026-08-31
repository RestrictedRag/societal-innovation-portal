import { NextResponse } from 'next/server';

import { buildNearbyProblemsGeoQuery } from '@/lib/geo-query';

export async function GET() {
  void buildNearbyProblemsGeoQuery();

  return NextResponse.json({
    message: 'Recommendations API ready',
    recommendations: [],
  });
}
