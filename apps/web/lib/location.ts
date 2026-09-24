import { cookies } from "next/headers";
import {
  DEFAULT_ZONE_ID,
  ZONE_REFERENCE_POINTS,
  getZoneList,
  getZoneName,
} from "./zones";

export { ZONE_REFERENCE_POINTS, DEFAULT_ZONE_ID, getZoneList, getZoneName };

export async function getSelectedZoneId(): Promise<string> {
  const cookieStore = await cookies();
  const zone = cookieStore.get("deuna_zone")?.value;
  if (zone && ZONE_REFERENCE_POINTS[zone]) return zone;
  return DEFAULT_ZONE_ID;
}

export async function getSelectedZoneCoordinates(): Promise<{
  lat: number;
  lng: number;
}> {
  const cookieStore = await cookies();
  const lat = Number(cookieStore.get("deuna_lat")?.value);
  const lng = Number(cookieStore.get("deuna_lng")?.value);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  const zoneId = await getSelectedZoneId();
  return ZONE_REFERENCE_POINTS[zoneId] ?? ZONE_REFERENCE_POINTS[DEFAULT_ZONE_ID]!;
}

export async function hasChosenZone(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get("deuna_zone")?.value);
}
