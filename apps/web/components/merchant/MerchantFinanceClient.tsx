"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDOP } from "@deuna/utils";
import {
  readBankAccount,
  readPayouts,
  writePayouts,
  type MerchantBankAccount,
  type MerchantPayout,
} from "@/lib/merchant-finance-storage";

export type FinanceTx = {
  id: string;
  code: string;
  createdAt: string;
  customerName: string;
  method: string;
  sale: number;
  commission: number;
  net: number;
  status: "completed" | "pending" | "cancelled";
};

const PAGE_SIZE = 8;
const METHOD_COLORS: Record<string, string> = {
  "Tarjeta de crédito": "#14A5A3",
  "Tarjeta de débito": "#0E7C7B",
  Efectivo: "#F2B705",
  "DeUna Pay": "#FF5C4D",
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

function endOfDay(value: string) {
  return new Date(`${value}T23:59:59`);
}

function nextMonday(from = new Date()) {
  const date = new Date(from);
  const day = date.getDay();
  const add = day === 1 ? 7 : (8 - day) % 7 || 7;
  date.setDate(date.getDate() + add);
  return date;
}

export function MerchantFinanceClient({
  merchantId,
  commissionPct,
  transactions,
}: {
  merchantId: string;
  commissionPct: number;
  transactions: FinanceTx[];
}) {
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(toInputDate(defaultFrom));
  const [to, setTo] = useState(toInputDate(today));
  const [tab, setTab] = useState<"tx" | "payouts" | "fees" | "reports">("tx");
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [payouts, setPayouts] = useState<MerchantPayout[]>([]);
  const [bank, setBank] = useState<MerchantBankAccount | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    const existing = readPayouts(merchantId);
    if (existing.length > 0) {
      setPayouts(existing);
    } else {
      const completedNet = transactions
        .filter((item) => item.status === "completed")
        .reduce((sum, item) => sum + item.net, 0);
      const seeded: MerchantPayout[] = [
        { id: "p1", amount: Math.round(completedNet * 0.18), status: "completed", at: new Date(today.getFullYear(), today.getMonth(), 15).toISOString() },
        { id: "p2", amount: Math.round(completedNet * 0.12), status: "completed", at: new Date(today.getFullYear(), today.getMonth(), 8).toISOString() },
        { id: "p3", amount: Math.round(completedNet * 0.1), status: "completed", at: new Date(today.getFullYear(), today.getMonth() - 1, 25).toISOString() },
      ].filter((item) => item.amount > 0);
      writePayouts(merchantId, seeded);
      setPayouts(seeded);
    }
    setBank(readBankAccount(merchantId));
  }, [merchantId, transactions]);

  const ranged = useMemo(() => {
    const start = startOfDay(from);
    const end = endOfDay(to);
    return transactions.filter((item) => {
      const date = new Date(item.createdAt);
      return date >= start && date <= end;
    });
  }, [transactions, from, to]);

  const counted = ranged.filter((item) => item.status !== "cancelled");
  const sales = counted.reduce((sum, item) => sum + item.sale, 0);
  const fees = counted.reduce((sum, item) => sum + item.commission, 0);
  const net = counted.reduce((sum, item) => sum + item.net, 0);
  const reserved = payouts.reduce((sum, item) => sum + item.amount, 0);
  const available = Math.max(0, net - reserved);

  const methodSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of counted) {
      map.set(item.method, (map.get(item.method) ?? 0) + item.sale);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [counted]);

  const daily = useMemo(() => {
    const start = startOfDay(from);
    const end = endOfDay(to);
    const days: { label: string; sales: number; net: number }[] = [];
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const key = toInputDate(cursor);
      const dayItems = counted.filter((item) => item.createdAt.slice(0, 10) === key);
      days.push({
        label: String(cursor.getDate()),
        sales: dayItems.reduce((sum, item) => sum + item.sale, 0),
        net: dayItems.reduce((sum, item) => sum + item.net, 0),
      });
    }
    return days.length > 24
      ? days.filter((_, index) => index % Math.ceil(days.length / 23) === 0)
      : days;
  }, [counted, from, to]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranged.filter((item) => {
      const matchesQuery =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        String(item.sale).includes(q);
      const matchesMethod = !method || item.method === method;
      const matchesStatus = !status || item.status === status;
      return matchesQuery && matchesMethod && matchesStatus;
    });
  }, [ranged, query, method, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function exportCsv() {
    const rows = [
      ["Fecha", "Pedido", "Cliente", "Método", "Venta", "Comisión", "Ingreso neto", "Estado"],
      ...filtered.map((item) => [
        new Date(item.createdAt).toLocaleString("es-DO"),
        item.code,
        item.customerName,
        item.method,
        String(item.sale),
        String(item.commission),
        String(item.net),
        item.status,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deuna-finanzas-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function requestPayout() {
    if (available <= 0) return;
    const next: MerchantPayout = {
      id: `pay-${Date.now()}`,
      amount: available,
      status: "pending",
      at: new Date().toISOString(),
    };
    const list = [next, ...payouts];
    writePayouts(merchantId, list);
    setPayouts(list);
    setRequestOpen(false);
  }

  const payoutDate = nextMonday();

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">
          Inicio
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-ink/70">Finanzas</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Finanzas</h1>
          <p className="mt-1 text-sm text-ink/50">Consulta tus ventas, pagos y transacciones en DeUna.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm text-ink" />
          <span className="text-ink/30">–</span>
          <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm text-ink" />
          <button type="button" onClick={exportCsv} className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink hover:border-teal">
            Exportar
          </button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Ventas totales" value={formatDOP(sales)} hint="En el periodo" />
        <Kpi label="Comisiones DeUna" value={formatDOP(fees)} hint={`${commissionPct}% del total`} />
        <Kpi label="Después de comisión" value={formatDOP(net)} hint="Ingreso neto" />
        <Kpi label="Pedidos" value={String(counted.length)} hint={`${ranged.filter((item) => item.status === "pending").length} en proceso`} />
        <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
          <p className="text-xs text-ink/45">Saldo disponible</p>
          <p className="mt-1 font-display text-2xl text-ink">{formatDOP(available)}</p>
          <p className="mt-1 text-[11px] text-ink/40">Listo para transferir a tu cuenta bancaria.</p>
        </article>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px_280px]">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Ventas y ganancias</h2>
            <p className="text-xs text-ink/40">● Ventas &nbsp; <span className="text-coral">— Ingreso neto</span></p>
          </div>
          <FinanceBars points={daily} />
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Resumen por método de pago</h2>
          <PaymentDonut items={methodSummary} total={sales} />
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <p className="text-xs text-ink/45">Próximo pago automático</p>
            <p className="mt-1 font-medium text-ink">
              {payoutDate.toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-sm text-ink/50">{formatDOP(available)} (estimado)</p>
            <button type="button" onClick={() => setRequestOpen(true)} className="mt-4 w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark">
              Solicitar pago
            </button>
            <Link href="/merchant/finanzas" className="mt-3 block text-center text-xs text-coral hover:underline" onClick={() => setTab("payouts")}>
              Ver calendario de pagos
            </Link>
          </article>
          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <h2 className="font-medium text-ink">Cuenta bancaria</h2>
            <p className="mt-2 text-sm text-ink">{bank?.bank}</p>
            <p className="text-xs text-ink/45">{bank?.type}</p>
            <p className="text-xs text-ink/45">***{bank?.last4}</p>
            <p className="mt-2 text-xs font-medium text-teal">{bank?.verified ? "Verificada" : "Pendiente"}</p>
          </article>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-4 border-b border-ink/8 text-sm">
            {(
              [
                ["tx", "Transacciones"],
                ["payouts", "Pagos a mi cuenta"],
                ["fees", "Comisiones"],
                ["reports", "Reportes"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={tab === id ? "border-b-2 border-coral pb-2 font-medium text-coral" : "pb-2 text-ink/45 hover:text-ink"}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "tx" && (
            <>
              <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setPage(1); }}
                  placeholder="Buscar por número de pedido, cliente o monto..."
                  className="min-w-0 flex-1 rounded-full border border-ink/10 bg-[#F6F5F2] px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
                />
                <select value={method} onChange={(event) => { setMethod(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-4 py-2.5 text-sm">
                  <option value="">Todos los métodos</option>
                  {Object.keys(METHOD_COLORS).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-4 py-2.5 text-sm">
                  <option value="">Todos los estados</option>
                  <option value="completed">Completado</option>
                  <option value="pending">Pendiente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                    <tr>
                      <th className="pb-3 font-medium">Fecha</th>
                      <th className="pb-3 font-medium">Pedido</th>
                      <th className="pb-3 font-medium">Cliente</th>
                      <th className="pb-3 font-medium">Método de pago</th>
                      <th className="pb-3 font-medium">Venta</th>
                      <th className="pb-3 font-medium">Comisión ({commissionPct}%)</th>
                      <th className="pb-3 font-medium">Ingreso neto</th>
                      <th className="pb-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-ink/40">No hay transacciones en este periodo.</td>
                      </tr>
                    ) : (
                      pageItems.map((item) => (
                        <tr key={item.id} className="border-t border-ink/6">
                          <td className="py-3 text-xs text-ink/50">
                            {new Date(item.createdAt).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}
                          </td>
                          <td className="py-3 font-medium text-ink">{item.code}</td>
                          <td className="py-3 text-ink/70">{item.customerName}</td>
                          <td className="py-3 text-ink/70">{item.method}</td>
                          <td className="py-3">{formatDOP(item.sale)}</td>
                          <td className="py-3 text-ink/50">{formatDOP(item.commission)}</td>
                          <td className="py-3 font-medium">{formatDOP(item.net)}</td>
                          <td className="py-3">
                            <span className={item.status === "completed" ? "text-xs font-medium text-teal" : item.status === "cancelled" ? "text-xs text-coral" : "text-xs text-gold"}>
                              {item.status === "completed" ? "Completado" : item.status === "cancelled" ? "Cancelado" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/45">
                <p>
                  Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} transacciones
                </p>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">‹</button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 6).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      className={item === currentPage ? "flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white" : "flex h-7 w-7 items-center justify-center rounded-lg hover:bg-ink/5"}
                    >
                      {item}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">›</button>
                </div>
              </div>
            </>
          )}

          {tab === "payouts" && (
            <ul className="mt-4 space-y-3">
              {payouts.length === 0 ? (
                <li className="text-sm text-ink/40">Todavía no hay pagos a tu cuenta.</li>
              ) : (
                payouts.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-2xl border border-ink/8 px-4 py-3">
                    <div>
                      <p className="font-medium text-ink">{formatDOP(item.amount)}</p>
                      <p className="text-xs text-ink/40">{new Date(item.at).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <span className={item.status === "completed" ? "text-xs font-medium text-teal" : "text-xs font-medium text-gold"}>
                      {item.status === "completed" ? "Completado" : "Pendiente"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}

          {tab === "fees" && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Kpi label="Comisión DeUna" value={`${commissionPct}%`} hint="Sobre cada pedido" />
              <Kpi label="Total comisiones" value={formatDOP(fees)} hint="En el periodo" />
              <Kpi label="Te queda" value={formatDOP(net)} hint="Después de comisión" />
            </div>
          )}

          {tab === "reports" && (
            <div className="mt-5 space-y-3 text-sm text-ink/60">
              <p>Periodo: {from} a {to}.</p>
              <p>{counted.length} pedidos generaron {formatDOP(sales)} en ventas y {formatDOP(net)} netos.</p>
              <button type="button" onClick={exportCsv} className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white">
                Descargar reporte CSV
              </button>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-ink">Historial de pagos</h2>
            <button type="button" onClick={() => setTab("payouts")} className="text-xs font-medium text-coral hover:underline">
              Ver todos
            </button>
          </div>
          <ul className="mt-4 space-y-3">
            {payouts.slice(0, 4).map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-ink">{formatDOP(item.amount)}</p>
                  <p className="text-xs text-ink/40">{new Date(item.at).toLocaleDateString("es-DO")}</p>
                </div>
                <span className={item.status === "completed" ? "text-xs text-teal" : "text-xs text-gold"}>
                  {item.status === "completed" ? "Completado" : "Pendiente"}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {requestOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" onClick={() => setRequestOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="font-display text-xl text-ink">Solicitar pago</h2>
            <p className="mt-2 text-sm text-ink/55">
              Transferiremos {formatDOP(available)} a {bank?.bank} · ***{bank?.last4}. El depósito puede tardar 1 día hábil.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setRequestOpen(false)} className="rounded-full px-4 py-2 text-sm text-ink/50">
                Cancelar
              </button>
              <button type="button" onClick={requestPayout} disabled={available <= 0} className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/45">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-ink/40">{hint}</p>
    </article>
  );
}

function FinanceBars({ points }: { points: { label: string; sales: number; net: number }[] }) {
  const max = Math.max(...points.map((point) => point.sales), 1);
  return (
    <div className="mt-4">
      <div className="flex h-44 items-end gap-1">
        {points.map((point) => (
          <div key={point.label} className="relative flex min-w-0 flex-1 flex-col items-center justify-end">
            <div className="w-full rounded-t bg-[#D7EEF0]" style={{ height: `${Math.max(6, (point.sales / max) * 100)}%` }} />
            <span className="absolute" style={{ bottom: `${(point.net / max) * 100}%` }}>
              <span className="block h-1.5 w-1.5 rounded-full bg-coral" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink/35">
        {points.filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0).map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function PaymentDonut({ items, total }: { items: { label: string; value: number }[]; total: number }) {
  let offset = 0;
  const circles = items.map((item) => {
    const pct = total > 0 ? item.value / total : 0;
    const dash = pct * 100;
    const circle = { ...item, dash, offset };
    offset += dash;
    return circle;
  });

  return (
    <div className="mt-4">
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
              stroke={METHOD_COLORS[item.label] ?? "#0E7C7B"}
              strokeWidth="4"
              strokeDasharray={`${item.dash} ${100 - item.dash}`}
              strokeDashoffset={-item.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-lg text-ink">{formatDOP(total)}</p>
          <p className="text-[10px] text-ink/40">Ventas totales</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-xs">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-ink/60">
              <span className="h-2 w-2 rounded-full" style={{ background: METHOD_COLORS[item.label] ?? "#0E7C7B" }} />
              {item.label}
            </span>
            <span className="text-ink/45">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
