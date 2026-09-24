import { prisma } from "@deuna/database";
import { getSelectedZoneCoordinates } from "@/lib/location";
import { getCurrentZoneLabel } from "@/lib/data";
import { OrderTrackingClient } from "@/components/OrderTrackingClient";
import type { FulfillmentType } from "@deuna/types";

export default async function OrderTrackingPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{
    total?: string;
    merchant?: string;
    merchantId?: string;
    fulfillment?: string;
    eta?: string;
  }>;
}) {
  const { code } = await params;
  const { total, merchant, merchantId, fulfillment, eta } = await searchParams;

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
      fulfillment={(fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY") as FulfillmentType}
      etaMinutes={eta ? Number(eta) : 25}
    />
  );
}
