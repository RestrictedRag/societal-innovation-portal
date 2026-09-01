export function buildNearbyProblemsGeoQuery() {
  const requestPoint = 'ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography';
  const effectiveLongitude = 'COALESCE(cp.longitude, u.longitude)';
  const effectiveLatitude = 'COALESCE(cp.latitude, u.latitude)';
  const problemLocationPoint = `ST_SetSRID(ST_MakePoint(${effectiveLongitude}, ${effectiveLatitude}), 4326)::geography`;

  return {
    requestPoint,
    problemLocationPoint,
    effectiveLatitude,
    effectiveLongitude,
    distanceExpression: `ST_Distance(${problemLocationPoint}, ${requestPoint}) / 1000.0 AS distance_km`,
    distanceFilter: `AND ST_DWithin(${problemLocationPoint}, ${requestPoint}, $3)`,
    radiusReference: 'DEFAULT_RADIUS_KM',
  };
}
