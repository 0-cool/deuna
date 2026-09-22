import { prisma } from "@deuna/database";
import { getSelectedZoneCoordinates } from "@/lib/location";
import { getCurrentZoneLabel } from "@/lib/data";
import { OrderTrackingClient } from "@/components/OrderTrackingClient";

// NOTA DE IMPLEMENTACIÓN: esta página simula el avance de estados en el cliente porque el
// pedido todavía no se persiste en la base de datos (ver checkout/page.tsx) — ver
// OrderTrackingClient. Las coordenadas del mapa sí son reales: el pickup viene de la ubicación
// real del merchant en Prisma, y el dropoff usa la zona de delivery seleccionada por el usuario
// (mismo mecanismo que ya usa el resto de la app para estimar distancia/ETA sin geocoding real
// — ver lib/location.ts). Cuando exista POST /api/orders con dirección geocodificada, el dropoff
// pasa a ser la coordenada exacta del pedido.
export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ total?: string; merchant?: string; merchantId?: string }>;
}) {
  const { code } = await params;
  const { total, merchant, merchantId } = await searchParams;

  const merchantLocation = merchantId
    ? await prisma.merchant.findUnique({
        where: { id: merchantId },
        include: { locations: true },
      })
    : null;

  const pickup = merchantLocation?.locations[0]
    ? {
        lat: merchantLocation.locations[0].latitude,
        lng: merchantLocation.locations[0].longitude,
        label: merchantLocation.name,
        address: merchantLocation.locations[0].address,
      }
    : null;

  const dropoffPoint = await getSelectedZoneCoordinates();
  const zoneLabel = await getCurrentZoneLabel();
  const dropoff = {
    lat: dropoffPoint.lat,
    lng: dropoffPoint.lng,
    label: "Tu zona de entrega",
    address: zoneLabel,
  };

  return (
    <OrderTrackingClient
      code={code}
      merchantName={merchant ?? merchantLocation?.name ?? null}
      total={total ?? null}
      pickup={pickup}
      dropoff={dropoff}
    />
  );
}
