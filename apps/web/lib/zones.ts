import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";

export const ZONE_REFERENCE_POINTS: Record<string, { lat: number; lng: number }> = {
  dn: { lat: 18.4655, lng: -69.9312 },
  sde: { lat: 18.4861, lng: -69.8312 },
  sdo: { lat: 18.4801, lng: -70.0021 },
  sdn: { lat: 18.5385, lng: -69.9012 },
};

export const DEFAULT_ZONE_ID = "dn";

export function getZoneList() {
  return DEFAULT_DELIVERY_ZONES;
}

export function getZoneName(zoneId: string): string {
  return DEFAULT_DELIVERY_ZONES.find((zone) => zone.id === zoneId)?.name ?? "Santo Domingo";
}

export function nearestZoneId(lat: number, lng: number): string {
  let bestId = DEFAULT_ZONE_ID;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const [id, point] of Object.entries(ZONE_REFERENCE_POINTS)) {
    const dLat = lat - point.lat;
    const dLng = lng - point.lng;
    const distance = dLat * dLat + dLng * dLng;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = id;
    }
  }
  return bestId;
}

export function setZoneCookie(zoneId: string, coords?: { lat: number; lng: number }) {
  const maxAge = 60 * 60 * 24 * 90;
  document.cookie = `deuna_zone=${zoneId}; path=/; max-age=${maxAge}`;
  if (coords) {
    document.cookie = `deuna_lat=${coords.lat}; path=/; max-age=${maxAge}`;
    document.cookie = `deuna_lng=${coords.lng}; path=/; max-age=${maxAge}`;
  }
}
