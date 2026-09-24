"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ORDER_STATUS_SEQUENCE, type FulfillmentType, type OrderChatMessage, type OrderRating, type OrderStatus, type StoredCustomerOrder } from "@deuna/types";
import { OrderTracker } from "@/components/OrderTracker";
import { OrderChat } from "@/components/OrderChat";
import { OrderRatingForm } from "@/components/OrderRating";
import { formatDOP } from "@deuna/utils";
import { getStoredOrder, setOrderStatus, upsertStoredOrder } from "@/lib/customer-storage";
import { Breadcrumbs } from "./Breadcrumbs";

const SIMULATION_INTERVAL_MS = 4000;

const OrderMap = dynamic(() => import("@/components/OrderMap").then((m) => m.OrderMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-card border border-ink-border bg-ink-soft text-sm text-paper/40">
      Cargando mapa…
    </div>
  ),
});

type MapPoint = { lat: number; lng: number; label: string; address: string };

const PICKUP_SEQUENCE: OrderStatus[] = [
  "ORDER_PLACED",
  "MERCHANT_ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DELIVERED",
];

function remainingMinutes(createdAt: string, etaMinutes: number, status: OrderStatus) {
  if (status === "DELIVERED" || status === "CANCELLED") return 0;
  const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000;
  return Math.max(1, Math.round(etaMinutes - elapsed));
}

export function OrderTrackingClient({
  code,
  merchantName,
  total,
  pickup,
  dropoff,
  fulfillment = "DELIVERY",
  etaMinutes = 25,
}: {
  code: string;
  merchantName: string | null;
  total: string | null;
  pickup: MapPoint | null;
  dropoff: MapPoint;
  fulfillment?: FulfillmentType;
  etaMinutes?: number;
}) {
  const stored = useMemo(() => getStoredOrder(code), [code]);
  const sequence = fulfillment === "PICKUP" ? PICKUP_SEQUENCE : ORDER_STATUS_SEQUENCE;
  const [statusIndex, setStatusIndex] = useState(() => {
    if (!stored) return 0;
    const idx = sequence.indexOf(stored.status);
    return idx >= 0 ? idx : 0;
  });
  const [cancelled, setCancelled] = useState(stored?.status === "CANCELLED");
  const [chat, setChat] = useState<OrderChatMessage[]>(stored?.chat ?? []);
  const [rating, setRating] = useState<OrderRating | null>(stored?.rating ?? null);
  const [tick, setTick] = useState(0);

  const currentStatus: OrderStatus = cancelled
    ? "CANCELLED"
    : sequence[statusIndex] ?? "ORDER_PLACED";
  const canCancel =
    !cancelled &&
    currentStatus !== "DELIVERED" &&
    currentStatus !== "PICKED_UP" &&
    currentStatus !== "ON_THE_WAY";

  useEffect(() => {
    if (cancelled) return;
    const interval = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, sequence.length - 1));
      setTick((value) => value + 1);
    }, SIMULATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [cancelled, sequence.length]);

  useEffect(() => {
    const existing = getStoredOrder(code);
    if (!existing) return;
    upsertStoredOrder({ ...existing, status: currentStatus });
  }, [code, currentStatus]);

  const eta = remainingMinutes(
    stored?.createdAt ?? new Date().toISOString(),
    stored?.etaMinutes ?? etaMinutes,
    currentStatus,
  );

  function cancelOrder() {
    if (!canCancel) return;
    setCancelled(true);
    setOrderStatus(code, "CANCELLED");
  }

  function ensureOrderShell() {
    const existing = getStoredOrder(code);
    if (existing) return existing;
    const shell: StoredCustomerOrder = {
      code,
      createdAt: new Date().toISOString(),
      fulfillment,
      merchantId: "",
      merchantName: merchantName ?? "",
      merchantAddress: pickup?.address ?? null,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      serviceFee: 0,
      total: Number(total ?? 0),
      paymentMethod: "CASH",
      fullName: "",
      phone: "",
      address: dropoff.address,
      reference: "",
      etaMinutes,
      status: currentStatus,
      cancelledAt: null,
      rating: null,
      chat,
    };
    upsertStoredOrder(shell);
    return shell;
  }

  return (
    <section className="mx-auto max-w-lg px-4 py-10">
      <Breadcrumbs items={[{ href: "/perfil", label: "Pedidos" }, { label: code }]} />
      <p className="text-sm text-paper/50">Pedido</p>
      <h1 className="font-display text-3xl text-paper">{code}</h1>
      {merchantName && <p className="mt-1 text-paper/70">{merchantName}</p>}
      {total && (
        <p className="mt-1 font-display text-xl text-teal-light">{formatDOP(Number(total))}</p>
      )}
      <p className="mt-2 text-sm text-paper/60">
        {fulfillment === "PICKUP" ? "Recoger en tienda" : "Delivery a domicilio"}
      </p>

      {currentStatus !== "CANCELLED" && currentStatus !== "DELIVERED" && (
        <div className="mt-4 rounded-card border border-teal/40 bg-teal/10 px-4 py-3">
          <p className="text-sm text-paper/70">Tiempo estimado</p>
          <p className="font-display text-2xl text-paper">
            {fulfillment === "PICKUP" ? `Listo en ~${eta} min` : `Llega en ~${eta} min`}
          </p>
        </div>
      )}

      {pickup ? (
        <div className="mt-6 overflow-hidden rounded-card border border-ink-border">
          <OrderMap
            pickup={pickup}
            dropoff={fulfillment === "PICKUP" ? pickup : dropoff}
            currentStatus={currentStatus}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-card border border-ink-border bg-ink-soft p-4 text-center text-xs text-paper/40">
          No se pudo ubicar la tienda en el mapa para este pedido.
        </p>
      )}

      <div className="mt-6 rounded-card border border-ink-border bg-ink-soft p-6">
        {currentStatus === "CANCELLED" ? (
          <p className="font-medium text-coral">Pedido cancelado</p>
        ) : (
          <OrderTracker currentStatus={currentStatus} />
        )}
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={cancelOrder}
          className="mt-4 w-full rounded-full border border-coral/50 px-4 py-3 text-sm font-medium text-coral hover:bg-coral/10"
        >
          Cancelar pedido
        </button>
      )}

      {fulfillment === "DELIVERY" && currentStatus !== "CANCELLED" && (
        <div className="mt-6">
          <OrderChat
            code={code}
            messages={chat}
            disabled={currentStatus === "DELIVERED"}
            onChange={(next) => {
              ensureOrderShell();
              setChat(next);
            }}
          />
        </div>
      )}

      {currentStatus === "DELIVERED" && (
        <div className="mt-6">
          <OrderRatingForm
            code={code}
            existing={rating}
            onSaved={(next) => {
              ensureOrderShell();
              setRating(next);
            }}
          />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-paper/40" data-tick={tick}>
        El mapa y el tiempo estimado se actualizan en vivo mientras avanza el pedido.
      </p>
    </section>
  );
}
