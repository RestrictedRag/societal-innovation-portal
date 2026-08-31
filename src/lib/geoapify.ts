export interface ReverseGeocodeLocation {
  city: string;
  state: string;
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeLocation | null> {
  // Geoapify is only ever called server-side (this module and the
  // /api/geocode/* route handlers), so the key must NOT be exposed to the
  // client. Prefer the server-only GEOAPIFY_API_KEY; keep the NEXT_PUBLIC_
  // name as a fallback for backwards compatibility with older env files.
  const apiKey = process.env.GEOAPIFY_API_KEY ?? process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  if (!apiKey) {
    return null;
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
    return null;
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
    }>;
  };

  const firstResult = payload.results?.[0];
  const city =
    firstResult?.city ?? firstResult?.town ?? firstResult?.village ?? firstResult?.municipality ?? '';
  const state = firstResult?.state ?? firstResult?.county ?? '';

  if (!city && !state) {
    return null;
  }

  return {
    city,
    state,
  };
}
