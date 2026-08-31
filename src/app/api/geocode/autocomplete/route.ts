import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 3) return NextResponse.json({ suggestions: [] });

  const apiKey = process.env.GEOAPIFY_API_KEY ?? process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Geoapify API key is not configured.' }, { status: 500 });

  try {
    const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
    url.searchParams.set('text', query);
    url.searchParams.set('type', 'city');
    url.searchParams.set('limit', '5');
    url.searchParams.set('format', 'json');
    url.searchParams.set('apiKey', apiKey);
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return NextResponse.json({ error: 'Location search failed.' }, { status: 502 });

    const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };
    const suggestions = (payload.results ?? []).flatMap((result, index) => {
      const address =
        result.address && typeof result.address === 'object'
          ? (result.address as Record<string, unknown>)
          : {};
      const resultType = String(result.result_type ?? result.type ?? '').toLowerCase();
      const latitude = Number(result.lat);
      const longitude = Number(result.lon);
      const firstText = (...values: unknown[]) =>
        values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
      const placeName = firstText(
        result.name,
        address.county,
        address.municipality,
        address.city,
        address.town,
        result.city,
        result.town,
        result.village,
        result.municipality
      );
      const city = firstText(result.city, result.town, result.village, address.city, address.town, placeName);
      const state = firstText(result.state, address.state);
      const district = firstText(result.district, address.district, result.county, address.county);
      const country = firstText(result.country, address.country);
      if (
        resultType === 'state' ||
        resultType === 'region' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !placeName ||
        !city
      ) return [];
      return [{
        id: String(result.place_id ?? `${latitude}-${longitude}-${index}`),
        formattedAddress: [city, state].filter(Boolean).join(', '),
        placeName,
        district,
        city,
        state,
        country,
        latitude,
        longitude,
      }];
    });
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Geoapify autocomplete failed:', error);
    return NextResponse.json({ error: 'Unable to search locations.' }, { status: 500 });
  }
}