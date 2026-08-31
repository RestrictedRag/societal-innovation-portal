import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = Number(searchParams.get('lat'));
    const longitude = Number(searchParams.get('lon'));

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json({ error: 'Latitude and longitude are required.' }, { status: 400 });
    }

    const apiKey = process.env.GEOAPIFY_API_KEY ?? process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Geoapify API key is not configured.' }, { status: 500 });
    }

    const url = new URL('https://api.geoapify.com/v1/geocode/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('apiKey', apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Reverse geocoding failed.' }, { status: 502 });
    }

    const payload = (await response.json()) as {
      results?: Array<{
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        county?: string;
        country?: string;
        formatted?: string;
        lat?: number;
        lon?: number;
      }>;
    };

    const firstResult = payload.results?.[0];
    const city =
      firstResult?.city ?? firstResult?.town ?? firstResult?.village ?? firstResult?.municipality ?? '';
    const state = firstResult?.state ?? firstResult?.county ?? '';

    if (!city && !state) {
      return NextResponse.json({ error: 'No city or state found for the provided coordinates.' }, { status: 404 });
    }

    return NextResponse.json({
      formattedAddress: [city, state].filter(Boolean).join(', '),
      city,
      state,
      country: firstResult?.country ?? '',
      latitude,
      longitude,
    });
  } catch (error) {
    console.error('Geoapify reverse geocode failed:', error);
    return NextResponse.json({ error: 'Unable to resolve location.' }, { status: 500 });
  }
}
