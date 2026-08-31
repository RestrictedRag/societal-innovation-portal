export function buildNearbyProblemsGeoQuery() {
  const requestPoint = 'ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography';
  const userLocationPoint = 'ST_SetSRID(ST_MakePoint(u.longitude, u.latitude), 4326)::geography';

  return {
    requestPoint,
    userLocationPoint,
    distanceExpression: `ST_Distance(${userLocationPoint}, ${requestPoint}) / 1000.0 AS distance_km`,
    distanceFilter: `AND ST_DWithin(${userLocationPoint}, ${requestPoint}, $3)`,
    radiusReference: 'DEFAULT_RADIUS_KM',
  };
}
