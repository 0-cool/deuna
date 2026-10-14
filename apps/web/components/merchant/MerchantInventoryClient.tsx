"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDOP } from "@deuna/utils";
import {
  adjustStockAction,
  bulkAdjustStockAction,
  updateLowStockAlertsAction,
} from "@/app/merchant/actions";
import {
  logInventoryMovement,
  readInventoryMovements,
  writeInventoryMovements,
  type InventoryMovement,
} from "@/lib/merchant-inventory-storage";

export type InventoryOffer = {
  id: string;
  sku: string;
  productName: string;
  brand: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string;
  price: number;
  quantity: number;
  lowStockAlert: number;
  updatedAt: string;
};

const PAGE_SIZE = 8;

function stockStatus(quantity: number, alert: number) {
  if (quantity <= 0) return { label: "Agotado", className: "text-coral" };
  if (quantity <= alert) return { label: "Stock bajo", className: "text-gold" };
  return { label: "En stock", className: "text-teal" };
}

function formatWhen(value: string) {
  const date = new Date(value);
  return date.toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MerchantInventoryClient({
  merchantId,
  offers,
}: {
  merchantId: string;
  offers: InventoryOffer[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [supplier, setSupplier] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [banner, setBanner] = useState(true);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  useEffect(() => {
    const existing = readInventoryMovements(merchantId);
    if (existing.length > 0) {
      setMovements(existing);
      return;
    }
    const seeded = seedMovements(offers);
    writeInventoryMovements(merchantId, seeded);
    setMovements(seeded);
  }, [merchantId, offers]);

  const categories = useMemo(
    () => Array.from(new Map(offers.map((offer) => [offer.categorySlug, offer.categoryName])).entries()),
    [offers],
  );
  const suppliers = useMemo(
    () => Array.from(new Set(offers.map((offer) => offer.brand))).sort((a, b) => a.localeCompare(b, "es")),
    [offers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((offer) => {
      const matchesQuery =
        !q ||
        offer.productName.toLowerCase().includes(q) ||
        offer.sku.toLowerCase().includes(q) ||
        offer.categoryName.toLowerCase().includes(q);
      const matchesCategory = !category || offer.categorySlug === category;
      const matchesSupplier = !supplier || offer.brand === supplier;
      const stock = stockStatus(offer.quantity, offer.lowStockAlert);
      const matchesStatus =
        !status ||
        (status === "ok" && stock.label === "En stock") ||
        (status === "low" && stock.label === "Stock bajo") ||
        (status === "out" && stock.label === "Agotado");
      return matchesQuery && matchesCategory && matchesSupplier && matchesStatus;
    });
  }, [offers, query, category, supplier, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const inStock = offers.filter((offer) => offer.quantity > 0).length;
  const low = offers.filter((offer) => offer.quantity > 0 && offer.quantity <= offer.lowStockAlert).length;
  const out = offers.filter((offer) => offer.quantity <= 0).length;
  const value = offers.reduce((sum, offer) => sum + offer.quantity * offer.price, 0);
  const alerts = offers
    .filter((offer) => offer.quantity <= offer.lowStockAlert)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  function toggleAll() {
    if (selected.length === pageItems.length) {
      setSelected((current) => current.filter((id) => !pageItems.some((item) => item.id === id)));
      return;
    }
    setSelected((current) => Array.from(new Set([...current, ...pageItems.map((item) => item.id)])));
  }

  async function bump(offer: InventoryOffer, delta: number) {
    const form = new FormData();
    form.set("offerId", offer.id);
    form.set("delta", String(delta));
    await adjustStockAction(form);
    const kind = delta > 0 ? "in" : "adjust";
    const next = logInventoryMovement(merchantId, {
      offerId: offer.id,
      productName: offer.productName,
      kind,
      delta,
    });
    setMovements((current) => [next, ...current].slice(0, 30));
  }

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">
          Inicio
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-ink/70">Inventario</span>
      </nav>

      <div>
        <h1 className="font-display text-3xl text-ink">Inventario</h1>
        <p className="mt-1 text-sm text-ink/50">
          Controla tu stock, recibe alertas y mantén tus productos siempre disponibles en DeUna.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Productos en stock" value={String(inStock)} hint="↑ vs. mes anterior" tone="teal" />
        <Kpi label="Stock bajo" value={String(low)} hint="↑ revisar pronto" tone="gold" />
        <Kpi label="Sin stock" value={String(out)} hint={out > 0 ? "↓ reponer" : "Sin faltantes"} tone="coral" />
        <Kpi label="Valor del inventario" value={formatDOP(value)} hint="A precio de lista" tone="teal" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">⌕</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar productos por nombre, SKU o categoría..."
                className="w-full rounded-full border border-ink/10 bg-[#F6F5F2] py-2.5 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-teal"
              />
            </label>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="">Todas las categorías</option>
              {categories.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="">Todos los estados</option>
              <option value="ok">En stock</option>
              <option value="low">Stock bajo</option>
              <option value="out">Agotado</option>
            </select>
            <select
              value={supplier}
              onChange={(event) => {
                setSupplier(event.target.value);
                setPage(1);
              }}
              className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="">Todos los proveedores</option>
              {suppliers.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark"
            >
              + Ajuste masivo
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                <tr>
                  <th className="pb-3 pr-2">
                    <input type="checkbox" checked={pageItems.length > 0 && pageItems.every((item) => selected.includes(item.id))} onChange={toggleAll} />
                  </th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">SKU</th>
                  <th className="pb-3 font-medium">Categoría</th>
                  <th className="pb-3 font-medium">Stock actual</th>
                  <th className="pb-3 font-medium">Stock mínimo</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Última actualización</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-ink/40">
                      No hay productos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((offer) => {
                    const stock = stockStatus(offer.quantity, offer.lowStockAlert);
                    return (
                      <tr key={offer.id} className="border-t border-ink/6">
                        <td className="py-3 pr-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(offer.id)}
                            onChange={() =>
                              setSelected((current) =>
                                current.includes(offer.id) ? current.filter((id) => id !== offer.id) : [...current, offer.id],
                              )
                            }
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 overflow-hidden rounded-xl bg-[#F6F5F2]">
                              {offer.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={offer.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-ink/30">
                                  {offer.productName.slice(0, 1)}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-ink">{offer.productName}</p>
                              <p className="text-xs text-ink/40">{offer.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-ink/50">{offer.sku}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-[#F6F5F2] px-2.5 py-1 text-xs text-ink/60">{offer.categoryName}</span>
                        </td>
                        <td className="py-3 font-medium text-ink">{offer.quantity}</td>
                        <td className="py-3 text-ink/60">{offer.lowStockAlert}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${stock.className}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {stock.label}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-ink/45">{formatWhen(offer.updatedAt)}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => bump(offer, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink/10 text-ink/50 hover:text-ink"
                            >
                              −
                            </button>
                            <button
                              type="button"
                              onClick={() => bump(offer, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-ink/10 text-ink/50 hover:text-ink"
                            >
                              +
                            </button>
                            <Link href={`/merchant/productos/${offer.id}/editar`} className="px-1 text-ink/30 hover:text-ink">
                              ⋯
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/45">
            <p>
              Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} productos
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1)
                .filter((item) => item === 1 || item === pageCount || Math.abs(item - currentPage) <= 1)
                .map((item, index, list) => (
                  <span key={item} className="flex items-center">
                    {index > 0 && list[index - 1] !== item - 1 ? <span className="px-1">…</span> : null}
                    <button
                      type="button"
                      onClick={() => setPage(item)}
                      className={
                        item === currentPage
                          ? "flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white"
                          : "flex h-7 w-7 items-center justify-center rounded-lg hover:bg-ink/5"
                      }
                    >
                      {item}
                    </button>
                  </span>
                ))}
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">
                ›
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Alertas de inventario</h2>
              <button type="button" onClick={() => setStatus("low")} className="text-xs font-medium text-coral hover:underline">
                Ver todas
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {alerts.length === 0 ? (
                <li className="text-sm text-ink/40">Todo el inventario está en buen nivel.</li>
              ) : (
                alerts.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F6F5F2]">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.productName}</p>
                      <p className={item.quantity <= 0 ? "text-xs text-coral" : "text-xs text-gold"}>
                        {item.quantity} unidades · {item.quantity <= 0 ? "Agotado" : "Stock bajo"}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Movimientos recientes</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {movements.slice(0, 6).map((move) => (
                <li key={move.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{movementLabel(move.kind)}</p>
                    <p className="text-xs text-ink/40">{move.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className={move.delta >= 0 ? "font-medium text-teal" : "font-medium text-coral"}>
                      {move.delta > 0 ? `+${move.delta}` : move.delta}
                    </p>
                    <p className="text-[11px] text-ink/35">{formatWhen(move.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>

      {banner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-coral/20 bg-[#FFF4F2] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Configura alertas automáticas de inventario</p>
            <p className="text-xs text-ink/50">Recibe avisos cuando un producto esté en stock bajo y mantén tu tienda activa.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark"
            >
              Configurar alertas
            </button>
            <button type="button" onClick={() => setBanner(false)} className="text-ink/30 hover:text-ink" aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>
      )}

      {bulkOpen && (
        <Modal title="Ajuste masivo" onClose={() => setBulkOpen(false)}>
          <p className="text-sm text-ink/55">
            {selected.length > 0
              ? `Se aplicará a ${selected.length} productos seleccionados.`
              : "Selecciona productos en la tabla o aplica el ajuste a todos los filtrados."}
          </p>
          <form
            action={async (formData) => {
              const ids = selected.length > 0 ? selected : filtered.map((item) => item.id);
              formData.set("offerIds", ids.join(","));
              const amount = Number(formData.get("amount"));
              await bulkAdjustStockAction(formData);
              ids.slice(0, 8).forEach((id) => {
                const offer = offers.find((item) => item.id === id);
                if (!offer) return;
                logInventoryMovement(merchantId, {
                  offerId: id,
                  productName: offer.productName,
                  kind: "adjust",
                  delta: amount,
                });
              });
              setMovements(readInventoryMovements(merchantId));
              setBulkOpen(false);
            }}
            className="mt-4 space-y-3"
          >
            <label className="block text-xs text-ink/50">
              Tipo de ajuste
              <select name="mode" className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal">
                <option value="add">Sumar / restar unidades</option>
                <option value="set">Fijar stock exacto</option>
              </select>
            </label>
            <label className="block text-xs text-ink/50">
              Cantidad
              <input
                name="amount"
                type="number"
                required
                defaultValue={10}
                className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
              />
            </label>
            <button type="submit" className="w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark">
              Aplicar ajuste
            </button>
          </form>
        </Modal>
      )}

      {alertsOpen && (
        <Modal title="Alertas automáticas" onClose={() => setAlertsOpen(false)}>
          <p className="text-sm text-ink/55">
            Define el stock mínimo para todos tus productos. Debajo de ese número verás la alerta de stock bajo.
          </p>
          <form
            action={async (formData) => {
              await updateLowStockAlertsAction(formData);
              setAlertsOpen(false);
            }}
            className="mt-4 space-y-3"
          >
            <label className="block text-xs text-ink/50">
              Umbral de stock bajo
              <input
                name="threshold"
                type="number"
                min={0}
                defaultValue={offers[0]?.lowStockAlert ?? 5}
                className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
              />
            </label>
            <button type="submit" className="w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark">
              Guardar umbral
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "teal" | "gold" | "coral";
}) {
  const color = tone === "gold" ? "text-gold" : tone === "coral" ? "text-coral" : "text-teal";
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/45">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{value}</p>
      <p className={`mt-1 text-[11px] ${color}`}>{hint}</p>
    </article>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="text-ink/30 hover:text-ink">
            ✕
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function movementLabel(kind: InventoryMovement["kind"]) {
  if (kind === "in") return "Entrada de inventario";
  if (kind === "sale") return "Venta (pedido)";
  if (kind === "out") return "Producto agotado";
  return "Ajuste manual";
}

function seedMovements(offers: InventoryOffer[]): InventoryMovement[] {
  const picks = offers.slice(0, 6);
  const kinds: InventoryMovement["kind"][] = ["in", "adjust", "sale", "out", "in", "sale"];
  const deltas = [24, -5, -2, -4, 20, -1];
  return picks.map((offer, index) => ({
    id: `seed-${offer.id}`,
    offerId: offer.id,
    productName: offer.productName,
    kind: kinds[index] ?? "adjust",
    delta: deltas[index] ?? 1,
    at: new Date(Date.now() - index * 3600_000).toISOString(),
  }));
}
