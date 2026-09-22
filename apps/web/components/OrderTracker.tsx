"use client";

import { ORDER_STATUS_SEQUENCE, type OrderStatus } from "@deuna/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  ORDER_PLACED: "Pedido recibido",
  MERCHANT_ACCEPTED: "Tienda confirmó tu pedido",
  PREPARING: "Tienda preparando",
  READY_FOR_PICKUP: "Listo para recoger",
  DRIVER_ASSIGNED: "Delivery asignado",
  PICKED_UP: "Pedido recogido",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export function OrderTracker({ currentStatus }: { currentStatus: OrderStatus }) {
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(currentStatus);

  return (
    <ol className="flex flex-col gap-4">
      {ORDER_STATUS_SEQUENCE.map((status, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={status} className="flex items-center gap-3">
            <span
              className={
                done || active
                  ? "flex h-6 w-6 items-center justify-center rounded-full bg-teal text-xs text-paper"
                  : "flex h-6 w-6 items-center justify-center rounded-full border border-ink-border text-xs text-paper/30"
              }
            >
              {done ? "✓" : active ? "●" : "○"}
            </span>
            <span className={active ? "font-medium text-paper" : done ? "text-paper/70" : "text-paper/40"}>
              {STATUS_LABELS[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
