"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ORDER_STATUS_SEQUENCE, type OrderStatus } from "@deuna/types";
import { OrderTracker } from "@/components/OrderTracker";
import { formatDOP } from "@deuna/utils";

const SIMULATION_INTERVAL_MS = 3000;

// El mapa usa Leaflet, que toca `window`/`document` durante el render (no solo en efectos), así
// que no puede pasar por SSR — ni siquiera como componente cliente normal. `ssr: false` lo saca
// del render del servidor por completo.
const OrderMap = dynamic(() => import("@/components/OrderMap").then((m) => m.OrderMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-card border border-ink-border bg-ink-soft text-sm text-paper/40">
      Cargando mapa…
    </div>
  ),
});

type MapPoint = { lat: number; lng: number; label: string; address: string };

export function OrderTrackingClient({
  code,
  merchantName,
  total,
  pickup,
  dropoff,
}: {
  code: string;
  merchantName: string | null;
  total: string | null;
  pickup: MapPoint | null;
  dropoff: MapPoint;
}) {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, ORDER_STATUS_SEQUENCE.length - 1));
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const currentStatus: OrderStatus = ORDER_STATUS_SEQUENCE[statusIndex] ?? "ORDER_PLACED";

  return (
    <section className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-paper/50">Pedido</p>
      <h1 className="font-display text-3xl text-paper">{code}</h1>
      {merchantName && <p className="mt-1 text-paper/70">{merchantName}</p>}
      {total && (
        <p className="mt-1 font-display text-xl text-teal-light">{formatDOP(Number(total))}</p>
      )}

      {pickup ? (
        <div className="mt-6 overflow-hidden rounded-card border border-ink-border">
          <OrderMap pickup={pickup} dropoff={dropoff} currentStatus={currentStatus} />
        </div>
      ) : (
        <p className="mt-6 rounded-card border border-ink-border bg-ink-soft p-4 text-center text-xs text-paper/40">
          No se pudo ubicar la tienda en el mapa para este pedido.
        </p>
      )}

      <div className="mt-6 rounded-card border border-ink-border bg-ink-soft p-6">
        <OrderTracker currentStatus={currentStatus} />
      </div>

      <p className="mt-6 text-center text-xs text-paper/40">
        Vista de demostración: el estado avanza automáticamente cada pocos segundos. El mapa y las
        ubicaciones sí son reales — lo que todavía no existe es el GPS en vivo del driver.
      </p>
    </section>
  );
}
