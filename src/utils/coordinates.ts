export type GeoJsonCoordinate = [longitude: number, latitude: number];

export interface LatLngCoordinate {
  latitude: number;
  longitude: number;
}

export function isValidCoordinate(latitude: unknown, longitude: unknown): boolean {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : Number(latitude);
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function toGoogleMapCoordinates(
  coordinates: GeoJsonCoordinate[] | [number, number][],
  format: 'geojson' | 'latlng' = 'geojson'
): LatLngCoordinate[] {
  if (!Array.isArray(coordinates)) return [];
  return coordinates
    .filter(
      (coord) =>
        Array.isArray(coord) &&
        typeof coord[0] === 'number' &&
        typeof coord[1] === 'number'
    )
    .map(([first, second]) => {
      const lat = format === 'geojson' ? second : first;
      const lng = format === 'geojson' ? first : second;
      return { latitude: lat, longitude: lng };
    })
    .filter((c) => isValidCoordinate(c.latitude, c.longitude));
}

