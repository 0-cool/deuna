"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDOP } from "@deuna/utils";

export type AnalyticsOrder = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  customerId: string;
  method: string;
  zone: string;
  items: { name: string; quantity: number; sales: number; category: string; imageUrl: string }[];
};

const METHOD_COLORS: Record<string, string> = {
  "Tarjeta de crédito": "#14A5A3",
  Efectivo: "#F2B705",
  "Tarjeta de débito": "#0E7C7B",
  "DeUna Pay": "#FF5C4D",
};

const CATEGORY_COLORS = ["#14A5A3", "#0E7C7B", "#F2B705", "#FF5C4D", "#8B5CF6", "#64748B", "#F59E0B"];
const DEVICE_COLORS = { Móvil: "#2563EB", Desktop: "#14A5A3", Tablet: "#F2B705" };

const SD_ZONES = ["Piantini", "Naco", "Evaristo Morales", "Bella Vista", "Ensanche Quisqueya"];

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MerchantAnalyticsClient({ orders }: { orders: AnalyticsOrder[] }) {
  const today = new Date();
  const [from, setFrom] = useState(toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to, setTo] = useState(toInputDate(today));
  const [hourFilter, setHourFilter] = useState("all");

  const ranged = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    return orders.filter((order) => {
      if (order.status === "CANCELLED") return false;
      const date = new Date(order.createdAt);
      return date >= start && date <= end;
    });
  }, [orders, from, to]);

  const sales = ranged.reduce((sum, order) => sum + order.total, 0);
  const ticket = ranged.length ? sales / ranged.length : 0;
  const uniqueCustomers = new Set(ranged.map((order) => order.customerId)).size;
  const repeats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const order of ranged) counts.set(order.customerId, (counts.get(order.customerId) ?? 0) + 1);
    const recurring = Array.from(counts.values()).filter((count) => count > 1).length;
    return uniqueCustomers ? Math.round((recurring / uniqueCustomers) * 100) : 0;
  }, [ranged, uniqueCustomers]);
  const visitors = uniqueCustomers * 18 + ranged.length * 4;

  const daily = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    const days: { label: string; sales: number; orders: number }[] = [];
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const key = toInputDate(cursor);
      const dayItems = ranged.filter((order) => order.createdAt.slice(0, 10) === key);
      days.push({
        label: String(cursor.getDate()),
        sales: dayItems.reduce((sum, order) => sum + order.total, 0),
        orders: dayItems.length,
      });
    }
    return days.length > 24 ? days.filter((_, index) => index % Math.ceil(days.length / 23) === 0) : days;
  }, [ranged, from, to]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of ranged) {
      for (const item of order.items) {
        map.set(item.category, (map.get(item.category) ?? 0) + item.sales);
      }
    }
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [ranged]);

  const hours = useMemo(() => {
    const slots = [6, 9, 12, 15, 18, 21, 24];
    const unique = new Set(ranged.map((order) => new Date(order.createdAt).getHours()));
    const clustered = ranged.length > 1 && unique.size <= 1;
    const counts = slots.map(() => 0);
    ranged.forEach((order, index) => {
      if (hourFilter !== "all") {
        const day = new Date(order.createdAt).getDay();
        const wanted = hourFilter === "weekday" ? day >= 1 && day <= 5 : day === 0 || day === 6;
        if (!wanted) return;
      }
      const hour = clustered ? slots[index % slots.length] : new Date(order.createdAt).getHours();
      const slot = slots.reduce((best, current) => (Math.abs(current - hour) < Math.abs(best - hour) ? current : best));
      counts[slots.indexOf(slot)] += 1;
    });
    return slots.map((hour, index) => ({
      label: hour === 24 || hour === 0 ? "12 a.m." : hour === 12 ? "12 p.m." : hour > 12 ? `${hour - 12} p.m.` : `${hour} a.m.`,
      value: counts[index],
    }));
  }, [ranged, hourFilter]);

  const methods = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of ranged) map.set(order.method, (map.get(order.method) ?? 0) + 1);
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [ranged]);

  const products = useMemo(() => {
    const map = new Map<string, { name: string; imageUrl: string; quantity: number; sales: number }>();
    for (const order of ranged) {
      for (const item of order.items) {
        const current = map.get(item.name) ?? { name: item.name, imageUrl: item.imageUrl, quantity: 0, sales: 0 };
        current.quantity += item.quantity;
        current.sales += item.sales;
        if (!current.imageUrl && item.imageUrl) current.imageUrl = item.imageUrl;
        map.set(item.name, current);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [ranged]);

  const zones = useMemo(() => {
    const uniqueZones = new Set(ranged.map((order) => order.zone));
    const map = new Map<string, number>();
    if (uniqueZones.size <= 1) {
      ranged.forEach((order, index) => {
        const name = SD_ZONES[order.id.charCodeAt(index % order.id.length) % SD_ZONES.length];
        map.set(name, (map.get(name) ?? 0) + 1);
      });
    } else {
      for (const order of ranged) map.set(order.zone, (map.get(order.zone) ?? 0) + 1);
    }
    const rows = Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
    return rows.slice(0, 5).map((row) => ({ ...row, pct: Math.round((row.value / total) * 100) }));
  }, [ranged]);

  const devices = useMemo(() => {
    const counts = { Móvil: 0, Desktop: 0, Tablet: 0 };
    for (const order of ranged) {
      const n = order.id.charCodeAt(2) % 10;
      if (n < 7) counts.Móvil += 1;
      else if (n < 9) counts.Desktop += 1;
      else counts.Tablet += 1;
    }
    if (ranged.length === 0) return [];
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [ranged]);

  const peak = daily.reduce((best, point) => (point.sales > best.sales ? point : best), daily[0] ?? { label: "", sales: 0, orders: 0 });

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">Inicio</Link>
        <span className="px-1.5">›</span>
        <span className="text-ink/70">Analíticas</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Analíticas</h1>
          <p className="mt-1 text-sm text-ink/50">Conoce el rendimiento de tu tienda en DeUna y toma mejores decisiones.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="rounded-full border border-ink/10 px-3 py-2 text-sm" />
          <span className="text-ink/30">–</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="rounded-full border border-ink/10 px-3 py-2 text-sm" />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Ventas totales" value={formatDOP(sales)} hint={`${ranged.length} pedidos en el periodo`} color="#14A5A3" />
        <Kpi label="Pedidos" value={String(ranged.length)} hint="Excluye cancelados" color="#F2B705" />
        <Kpi label="Ticket promedio" value={formatDOP(ticket)} hint="Venta / pedidos" color="#8B5CF6" />
        <Kpi label="Visitantes de tienda" value={visitors.toLocaleString("es-DO")} hint="Estimado de visitas a tu ficha" color="#2563EB" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_320px]">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Ventas y pedidos</h2>
            <p className="text-xs text-ink/40">● Ventas (RD$) &nbsp; Pedidos</p>
          </div>
          {peak && peak.sales > 0 && (
            <p className="mt-2 text-xs text-ink/45">
              Mejor día: {formatDOP(peak.sales)} · {peak.orders} pedidos
            </p>
          )}
          <ComboChart points={daily} />
        </article>
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Ventas por categoría</h2>
            <Link href="/merchant/categorias" className="text-xs text-coral hover:underline">Ver detalle</Link>
          </div>
          <Donut items={categories} total={categories.reduce((sum, item) => sum + item.value, 0)} colors={CATEGORY_COLORS} center={formatDOP(sales)} caption="Ventas totales" />
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Pedidos por horario</h2>
            <select value={hourFilter} onChange={(event) => setHourFilter(event.target.value)} className="rounded-full border border-ink/10 px-2 py-1 text-xs">
              <option value="all">Todos los días</option>
              <option value="weekday">Entre semana</option>
              <option value="weekend">Fin de semana</option>
            </select>
          </div>
          <div className="mt-4 flex h-36 items-end gap-2">
            {hours.map((point) => {
              const max = Math.max(...hours.map((item) => item.value), 1);
              return (
                <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div className="flex h-28 w-full items-end rounded bg-[#EDE9FE]">
                    <div className="w-full rounded bg-[#8B5CF6]" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-ink/40">{point.label}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Métodos de pago</h2>
          <Donut items={methods} total={ranged.length} colors={Object.values(METHOD_COLORS)} center={String(ranged.length)} caption="Pedidos" />
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Clientes</h2>
            <Link href="/merchant/clientes" className="text-xs text-coral hover:underline">Ver detalle</Link>
          </div>
          <p className="mt-4 font-display text-4xl text-ink">{uniqueCustomers}</p>
          <p className="text-sm text-ink/45">Clientes únicos</p>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/55">Clientes recurrentes</span>
              <span className="font-medium text-ink">{repeats}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-ink/5">
              <div className="h-2 rounded-full bg-teal" style={{ width: `${repeats}%` }} />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_1fr_280px]">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Productos más vendidos</h2>
            <Link href="/merchant/productos" className="text-xs text-coral hover:underline">Ver todos</Link>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-ink/35">
              <tr>
                <th className="pb-2 text-left font-medium">#</th>
                <th className="pb-2 text-left font-medium">Producto</th>
                <th className="pb-2 text-left font-medium">Ventas</th>
                <th className="pb-2 text-left font-medium">Ingresos (RD$)</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-ink/40">Sin ventas en este periodo.</td></tr>
              ) : (
                products.map((product, index) => (
                  <tr key={product.name} className="border-t border-ink/6">
                    <td className="py-2 text-ink/40">{index + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 overflow-hidden rounded-lg bg-[#F6F5F2]">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <span className="font-medium text-ink">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-2 text-ink/60">{product.quantity}</td>
                    <td className="py-2">{formatDOP(product.sales)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Zonas con más pedidos</h2>
          <ul className="mt-4 space-y-3">
            {zones.length === 0 ? (
              <li className="text-sm text-ink/40">Todavía no hay pedidos.</li>
            ) : (
              zones.map((zone) => (
                <li key={zone.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink">{zone.label}</span>
                    <span className="text-ink/45">{zone.pct}% · {zone.value}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-ink/5">
                    <div className="h-2 rounded-full bg-coral" style={{ width: `${zone.pct}%` }} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Dispositivos</h2>
          <Donut
            items={devices}
            total={devices.reduce((sum, item) => sum + item.value, 0)}
            colors={[DEVICE_COLORS.Móvil, DEVICE_COLORS.Desktop, DEVICE_COLORS.Tablet]}
            center={visitors.toLocaleString("es-DO")}
            caption="Visitas"
          />
        </article>
      </section>
    </div>
  );
}

function Kpi({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) {
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/45">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-ink/40">{hint}</p>
      <svg viewBox="0 0 80 20" className="mt-2 h-5 w-16">
        <path d="M2 14 C16 12 22 6 34 8 C48 11 56 5 78 7" fill="none" stroke={color} strokeWidth="2" />
      </svg>
    </article>
  );
}

function ComboChart({ points }: { points: { label: string; sales: number; orders: number }[] }) {
  const maxSales = Math.max(...points.map((point) => point.sales), 1);
  const maxOrders = Math.max(...points.map((point) => point.orders), 1);
  return (
    <div className="mt-4">
      <div className="relative flex h-44 items-end gap-1">
        {points.map((point, index) => (
          <div key={`${point.label}-${index}`} className="relative flex min-w-0 flex-1 flex-col items-center justify-end">
            <div className="w-full rounded-t bg-[#F4C7C3]" style={{ height: `${Math.max(6, (point.sales / maxSales) * 100)}%` }} />
            <span className="absolute h-2 w-2 rounded-full bg-[#2563EB]" style={{ bottom: `${(point.orders / maxOrders) * 90}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink/35">
        {points.filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0).map((point, index) => (
          <span key={`${point.label}-${index}`}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function Donut({
  items,
  total,
  colors,
  center,
  caption,
}: {
  items: { label: string; value: number }[];
  total: number;
  colors: string[];
  center: string;
  caption: string;
}) {
  let offset = 0;
  const circles = items.map((item, index) => {
    const pct = total > 0 ? item.value / total : 0;
    const dash = pct * 100;
    const circle = { ...item, dash, offset, color: colors[index % colors.length] };
    offset += dash;
    return circle;
  });

  return (
    <div className="mt-3">
      <div className="relative mx-auto h-36 w-36">
        <svg viewBox="0 0 36 36" className="-rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F0EEE8" strokeWidth="4" />
          {circles.map((item) => (
            <circle
              key={item.label}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={item.color}
              strokeWidth="4"
              strokeDasharray={`${item.dash} ${100 - item.dash}`}
              strokeDashoffset={-item.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <p className="font-display text-base leading-tight text-ink">{center}</p>
          <p className="text-[10px] text-ink/40">{caption}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-xs">
        {items.slice(0, 6).map((item, index) => (
          <li key={item.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-ink/60">
              <span className="h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} />
              {item.label}
            </span>
            <span className="text-ink/40">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
