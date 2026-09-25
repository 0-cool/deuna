import Link from "next/link";
import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantOffers } from "@/lib/merchant-data";
import { deleteOfferAction } from "../../actions";
import { DeleteOfferButton } from "@/components/merchant/DeleteOfferButton";
import { MerchantAvailabilityToggle } from "@/components/merchant/MerchantAvailabilityToggle";
import { formatDOP } from "@deuna/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

const NOTICE_LABELS: Record<string, string> = {
  created: "Producto agregado a tu catálogo.",
  updated: "Cambios guardados.",
  deleted: "Producto eliminado.",
  deactivated:
    "Ese producto tiene pedidos asociados, así que lo desactivamos en vez de eliminarlo — ya no aparece en tu tienda, pero el historial de pedidos queda intacto.",
};

function stockInfo(quantity: number, lowStockAlert: number) {
  if (quantity <= 0) return { label: "Sin stock", className: "text-coral" };
  if (quantity <= lowStockAlert) return { label: "Stock bajo", className: "text-gold" };
  return { label: "En stock", className: "text-teal" };
}

function MiniSpark({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 28" className="h-7 w-16">
      <path
        d="M2 20 C14 18 18 8 30 12 C42 16 48 6 58 8 C66 10 72 16 78 12"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildQuery(params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  if (params.status) search.set("status", params.status);
  if (page > 1) search.set("page", String(page));
  const value = search.toString();
  return value ? `/merchant/productos?${value}` : "/merchant/productos";
}

export default async function MerchantProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; q?: string; category?: string; status?: string; page?: string }>;
}) {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const { notice, q, category, status, page: pageParam } = await searchParams;
  const noticeLabel = notice ? NOTICE_LABELS[notice] : undefined;
  const offers = await getMerchantOffers(merchant.id);
  const query = (q ?? "").trim().toLowerCase();

  const categories = Array.from(
    new Map(offers.map((offer) => [offer.categorySlug, offer.categoryName])).entries(),
  );

  const filtered = offers.filter((offer) => {
    const matchesQuery =
      !query ||
      offer.productName.toLowerCase().includes(query) ||
      offer.brand.toLowerCase().includes(query) ||
      offer.sku.toLowerCase().includes(query) ||
      offer.categoryName.toLowerCase().includes(query);
    const matchesCategory = !category || offer.categorySlug === category;
    const matchesStatus =
      !status ||
      status === "all" ||
      (status === "active" && offer.isAvailable) ||
      (status === "paused" && !offer.isAvailable) ||
      (status === "out" && offer.quantity <= 0);
    return matchesQuery && matchesCategory && matchesStatus;
  });

  const total = offers.length;
  const active = offers.filter((offer) => offer.isAvailable).length;
  const paused = offers.filter((offer) => !offer.isAvailable).length;
  const outOfStock = offers.filter((offer) => offer.quantity <= 0).length;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const kpis = [
    { label: "Productos totales", value: String(total), color: "#0E7C7B" },
    { label: "Activos", value: String(active), color: "#14A5A3", hint: `${Math.round((active / Math.max(total, 1)) * 100)}% del catálogo` },
    { label: "Pausados", value: String(paused), color: "#F2B705" },
    { label: "Sin stock", value: String(outOfStock), color: "#FF5C4D" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Productos</h1>
          <p className="mt-1 text-sm text-ink/50">
            Gestiona tu catálogo para que los clientes puedan encontrarlo en DeUna.
          </p>
        </div>
        <Link
          href="/merchant/productos/nuevo"
          className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark"
        >
          + Agregar producto
        </Link>
      </div>

      {noticeLabel && (
        <p className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">{noticeLabel}</p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="flex items-center justify-between rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
            <div>
              <p className="text-xs text-ink/45">{kpi.label}</p>
              <p className="mt-1 font-display text-3xl text-ink">{kpi.value}</p>
              {kpi.hint ? <p className="mt-1 text-[11px] text-teal">{kpi.hint}</p> : null}
            </div>
            <MiniSpark color={kpi.color} />
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm sm:p-5">
        <form className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">⌕</span>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Buscar productos por nombre, código o categoría..."
              className="w-full rounded-full border border-ink/10 bg-[#F6F5F2] py-2.5 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-teal"
            />
          </label>
          <select
            name="category"
            defaultValue={category ?? ""}
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
            name="status"
            defaultValue={status ?? ""}
            className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="paused">Pausados</option>
            <option value="out">Sin stock</option>
          </select>
          <button
            type="submit"
            className="rounded-full border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink/70 hover:text-ink"
          >
            Filtrar
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-ink/35">
              <tr>
                <th className="pb-3 font-medium">Producto</th>
                <th className="pb-3 font-medium">Categoría</th>
                <th className="pb-3 font-medium">Precio</th>
                <th className="pb-3 font-medium">Stock</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium">Visibilidad</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-ink/40">
                    No hay productos con esos filtros.
                  </td>
                </tr>
              ) : (
                pageItems.map((offer) => {
                  const stock = stockInfo(offer.quantity, offer.lowStockAlert);
                  return (
                    <tr key={offer.id} className="border-t border-ink/6">
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
                            <p className="text-xs text-ink/40">SKU: {offer.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-[#F6F5F2] px-2.5 py-1 text-xs text-ink/60">
                          {offer.categoryName}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-ink">{formatDOP(offer.price)}</td>
                      <td className="py-3">
                        <p className={`text-sm font-medium ${stock.className}`}>
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                          {offer.quantity}
                        </p>
                        <p className={`text-[11px] ${stock.className}`}>{stock.label}</p>
                      </td>
                      <td className="py-3">
                        <MerchantAvailabilityToggle offerId={offer.id} isAvailable={offer.isAvailable} />
                      </td>
                      <td className="py-3">
                        <span className={offer.isAvailable ? "text-xs font-medium text-teal" : "text-xs font-medium text-ink/35"}>
                          {offer.isAvailable ? "● Visible" : "○ Oculto"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/merchant/productos/${offer.id}/editar`}
                            className="text-ink/40 hover:text-ink"
                            aria-label="Editar"
                          >
                            ✎
                          </Link>
                          <DeleteOfferButton
                            offerId={offer.id}
                            productName={offer.productName}
                            action={deleteOfferAction}
                          />
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
            Mostrando {from}–{to} de {filtered.length} productos
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={buildQuery({ q, category, status }, Math.max(1, currentPage - 1))}
              className="rounded-lg px-2 py-1 hover:bg-ink/5"
            >
              ‹
            </Link>
            {Array.from({ length: pageCount }, (_, index) => index + 1)
              .filter((item) => item === 1 || item === pageCount || Math.abs(item - currentPage) <= 1)
              .map((item, index, list) => (
                <span key={item} className="flex items-center">
                  {index > 0 && list[index - 1] !== item - 1 ? <span className="px-1">…</span> : null}
                  <Link
                    href={buildQuery({ q, category, status }, item)}
                    className={
                      item === currentPage
                        ? "flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white"
                        : "flex h-7 w-7 items-center justify-center rounded-lg hover:bg-ink/5"
                    }
                  >
                    {item}
                  </Link>
                </span>
              ))}
            <Link
              href={buildQuery({ q, category, status }, Math.min(pageCount, currentPage + 1))}
              className="rounded-lg px-2 py-1 hover:bg-ink/5"
            >
              ›
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
