import { cookies } from "next/headers";
import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";

// Coordenadas representativas (centroide aproximado) de cada zona, usadas para calcular
// distancia/ETA en el MVP. Cuando se integre un MapProvider real (sección 27 del spec),
// esto se reemplaza por la geolocalización exacta del usuario / geocoding de su dirección.
export const ZONE_REFERENCE_POINTS: Record<
  string,
  { lat: number; lng: number }
> = {
  dn: { lat: 18.4655, lng: -69.9312 },
  sde: { lat: 18.4861, lng: -69.8312 },
  sdo: { lat: 18.4801, lng: -70.0021 },
  sdn: { lat: 18.5385, lng: -69.9012 },
};

export const DEFAULT_ZONE_ID = "dn";

export function getZoneList() {
  return DEFAULT_DELIVERY_ZONES;
}

// Lee la zona elegida por el usuario desde una cookie. Server-side only.
// `await` funciona tanto si `cookies()` devuelve el store directamente (Next 14) como si
// devuelve una Promise del store (Next 15+) — así el código funciona en ambas versiones.
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
  const zoneId = await getSelectedZoneId();
  return (
    ZONE_REFERENCE_POINTS[zoneId] ?? ZONE_REFERENCE_POINTS[DEFAULT_ZONE_ID]!
  );
}

export function getZoneName(zoneId: string): string {
  return (
    DEFAULT_DELIVERY_ZONES.find((z) => z.id === zoneId)?.name ?? "Santo Domingo"
  );
}
