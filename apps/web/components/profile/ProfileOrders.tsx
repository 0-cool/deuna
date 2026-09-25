"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { OrderStatus, StoredCustomerOrder } from "@deuna/types";
import { formatDOP } from "@deuna/utils";

type FilterKey = "all" | "active" | "delivered" | "cancelled";
type SortKey = "recent" | "oldest" | "total";

const STEPS: { label: string; statuses: OrderStatus[] }[] = [
  { label: "Pedido recibido", statuses: ["ORDER_PLACED", "MERCHANT_ACCEPTED"] },
  { label: "Preparando tu pedido", statuses: ["PREPARING", "READY_FOR_PICKUP"] },
  { label: "En camino", statuses: ["DRIVER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"] },
  { label: "Entregado", statuses: ["DELIVERED"] },
];

function isActive(status: OrderStatus) {
  return status !== "DELIVERED" && status !== "CANCELLED";
}

function statusLabel(status: OrderStatus) {
  if (status === "CANCELLED") return "Cancelado";
  if (status === "DELIVERED") return "Entregado";
  if (status === "ON_THE_WAY" || status === "PICKED_UP" || status === "DRIVER_ASSIGNED") return "En camino";
  if (status === "PREPARING" || status === "READY_FOR_PICKUP") return "Preparando";
  return "En curso";
}

function statusTone(status: OrderStatus) {
  if (status === "CANCELLED") return "bg-coral/15 text-coral";
  if (status === "DELIVERED") return "bg-teal/15 text-teal-light";
  return "bg-gold/15 text-gold";
}

function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
}

function itemsLine(order: StoredCustomerOrder) {
  return order.items
    .slice(0, 4)
    .map((item) => `${item.quantity} ${item.productName}`)
    .join(", ");
}

function paymentLabel(method: StoredCustomerOrder["paymentMethod"]) {
  if (method === "CARD") return "Tarjeta";
  if (method === "TRANSFER") return "Transferencia";
  return "Efectivo";
}

function remainingMinutes(order: StoredCustomerOrder) {
  const elapsed = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  return Math.max(1, Math.round(order.etaMinutes - elapsed));
}

function stepIndex(status: OrderStatus) {
  const idx = STEPS.findIndex((step) => step.statuses.includes(status));
  return idx >= 0 ? idx : 0;
}

export function ProfileOrders({
  orders,
  onRepeat,
}: {
  orders: StoredCustomerOrder[];
  onRepeat: (order: StoredCustomerOrder) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const counts = useMemo(
    () => ({
      all: orders.length,
      active: orders.filter((order) => isActive(order.status)).length,
      delivered: orders.filter((order) => order.status === "DELIVERED").length,
      cancelled: orders.filter((order) => order.status === "CANCELLED").length,
    }),
    [orders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = orders.filter((order) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && isActive(order.status)) ||
        (filter === "delivered" && order.status === "DELIVERED") ||
        (filter === "cancelled" && order.status === "CANCELLED");
      const matchesQuery =
        !q ||
        order.code.toLowerCase().includes(q) ||
        order.merchantName.toLowerCase().includes(q) ||
        order.items.some((item) => item.productName.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
    next.sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === "total") return b.total - a.total;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return next;
  }, [orders, query, filter, sort]);

  const activeOrders = filtered.filter((order) => isActive(order.status));
  const history = filtered.filter((order) => !isActive(order.status));
  const delivered = orders.filter((order) => order.status === "DELIVERED");
  const spent = delivered.reduce((sum, order) => sum + order.total, 0);
  const deliveredPct = orders.length ? Math.round((delivered.length / orders.length) * 100) : 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <h1 className="font-display text-3xl text-paper">Mis pedidos</h1>
        <p className="mt-1 text-sm text-paper/55">
          Revisa, da seguimiento y vuelve a pedir tus productos favoritos.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en mis pedidos"
            className="min-w-[180px] flex-1 rounded-full border border-ink-border bg-ink-soft px-4 py-2 text-sm text-paper outline-none focus:border-teal"
          />
          {(
            [
              ["all", `Todos (${counts.all})`],
              ["active", `En curso (${counts.active})`],
              ["delivered", `Entregados (${counts.delivered})`],
              ["cancelled", `Cancelados (${counts.cancelled})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === key ? "bg-teal text-paper" : "border border-ink-border bg-ink-soft text-paper/70"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-ink-border bg-ink-soft px-3 py-1.5 text-sm text-paper"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="total">Mayor total</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-card border border-ink-border bg-ink-soft p-8 text-center">
            <p className="text-paper/80">No hay pedidos con esos filtros.</p>
            <Link href="/tiendas" className="mt-3 inline-flex rounded-full bg-teal px-4 py-2 text-sm text-paper">
              Explorar tiendas
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {activeOrders.map((order) => {
              const current = stepIndex(order.status);
              const mins = remainingMinutes(order);
              return (
                <article key={order.code} className="rounded-card border border-ink-border bg-ink-soft p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal font-display text-lg text-paper">
                        {order.items[0]?.productImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={order.items[0].productImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          order.merchantName.slice(0, 1)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-paper">{order.merchantName}</p>
                        <p className="text-xs text-paper/45">Pedido #{order.code}</p>
                        <p className="text-xs text-paper/45">{formatOrderDate(order.createdAt)}</p>
                        <p className="mt-1 truncate text-sm text-paper/65">{itemsLine(order)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                      <p className="mt-2 text-sm text-paper/70">Llega en {mins}–{mins + 6} min</p>
                      <Link
                        href={`/pedido/${order.code}`}
                        className="mt-3 inline-flex rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light"
                      >
                        Ver seguimiento
                      </Link>
                    </div>
                  </div>

                  <ol className="mt-6 grid grid-cols-4 gap-2">
                    {STEPS.map((step, index) => {
                      const done = index <= current;
                      const active = index === current;
                      return (
                        <li key={step.label} className="min-w-0">
                          <div className={`h-1.5 rounded-full ${done ? "bg-teal" : "bg-ink-border"}`} />
                          <p className={`mt-2 text-xs ${active ? "text-teal-light" : "text-paper/45"}`}>{step.label}</p>
                          {active && (
                            <p className="text-[11px] text-paper/40">{formatTime(order.createdAt)}</p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </article>
              );
            })}

            {history.map((order) => (
              <article key={order.code} className="rounded-card border border-ink-border bg-ink-soft p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink">
                    {order.items[0]?.productImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={order.items[0].productImageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-paper">{order.merchantName.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-paper">{order.merchantName}</p>
                    <p className="text-xs text-paper/45">Pedido #{order.code}</p>
                    <p className="text-xs text-paper/45">{formatOrderDate(order.createdAt)}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-paper/60">{itemsLine(order)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <p className="mt-2 font-display text-lg text-paper">
                      {order.status === "CANCELLED" ? formatDOP(0) : formatDOP(order.total)}
                    </p>
                    <p className="text-xs text-paper/40">{paymentLabel(order.paymentMethod)}</p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-col">
                    <Link
                      href={`/pedido/${order.code}`}
                      className="rounded-full border border-ink-border px-3 py-1.5 text-sm text-paper hover:border-teal"
                    >
                      Ver detalles
                    </Link>
                    {order.status === "DELIVERED" ? (
                      <button
                        type="button"
                        onClick={() => onRepeat(order)}
                        className="rounded-full bg-teal px-3 py-1.5 text-sm text-paper hover:bg-teal-light"
                      >
                        Volver a pedir
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 text-sm text-paper/35">Cancelado</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="text-xs uppercase tracking-wide text-paper/40">Resumen de mis pedidos</p>
          <p className="mt-1 text-sm text-paper/55">Últimos pedidos en este dispositivo</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-ink p-3">
              <p className="text-paper/45">Total de pedidos</p>
              <p className="mt-1 font-display text-2xl text-paper">{counts.all}</p>
            </div>
            <div className="rounded-xl bg-ink p-3">
              <p className="text-paper/45">Entregados</p>
              <p className="mt-1 font-display text-2xl text-teal-light">{counts.delivered}</p>
              <p className="text-xs text-paper/40">{deliveredPct}%</p>
            </div>
            <div className="rounded-xl bg-ink p-3">
              <p className="text-paper/45">En curso</p>
              <p className="mt-1 font-display text-2xl text-gold">{counts.active}</p>
            </div>
            <div className="rounded-xl bg-ink p-3">
              <p className="text-paper/45">Cancelados</p>
              <p className="mt-1 font-display text-2xl text-coral">{counts.cancelled}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-ink-border pt-4">
            <span className="text-sm text-paper/55">Total gastado</span>
            <span className="font-display text-xl text-paper">{formatDOP(spent)}</span>
          </div>
        </div>

        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">¿Necesitas ayuda con un pedido?</p>
          <p className="mt-1 text-sm text-paper/55">
            Te ayudamos con incidencias, cambios o si no te llegó tu pedido.
          </p>
          <a
            href="mailto:ayuda@deuna.do"
            className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light"
          >
            Contactar soporte
          </a>
        </div>

        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">¿Tienes un pedido favorito?</p>
          <p className="mt-1 text-sm text-paper/55">Vuelve a pedir más rápido desde las tiendas cerca de ti.</p>
          <Link
            href="/tiendas"
            className="mt-4 inline-flex rounded-full border border-ink-border px-4 py-2 text-sm text-paper hover:border-teal"
          >
            Explorar tiendas
          </Link>
        </div>
      </aside>
    </div>
  );
}
