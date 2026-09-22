import Link from "next/link";
import { getCurrentMerchant } from "@/lib/auth";
import { searchMerchantCatalog } from "@/lib/merchant-data";
import { CATEGORY_RULES } from "@deuna/config";
import { createProductAction, createOfferForProductAction } from "../../../actions";

export const dynamic = "force-dynamic";

export default async function NewMerchantProductPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const { q } = await searchParams;
  const hasQuery = Boolean(q && q.trim());
  const catalogMatches = hasQuery ? await searchMerchantCatalog(merchant.id, q!) : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/merchant/productos" className="text-xs text-paper/50 hover:text-paper">
          ← Volver a productos
        </Link>
        <h1 className="mt-2 font-display text-2xl text-paper">Agregar producto</h1>
      </div>

      <section className="rounded-card border border-ink-border bg-ink-soft p-5">
        <h2 className="font-display text-lg text-paper">
          Vender un producto que ya existe en DeUna
        </h2>
        <p className="mt-1 text-sm text-paper/60">
          Si otra tienda ya vende este producto, agrégalo desde el catálogo compartido en vez de
          crear un duplicado — así los clientes lo ven junto a los demás precios en el comparador.
        </p>

        <form className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o marca…"
            className="w-full max-w-sm rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
          <button
            type="submit"
            className="rounded-lg border border-ink-border px-4 py-2 text-sm font-medium text-paper transition hover:border-teal"
          >
            Buscar
          </button>
        </form>

        {hasQuery && (
          <div className="mt-4 flex flex-col gap-3">
            {catalogMatches.length === 0 ? (
              <p className="text-sm text-paper/50">
                No encontramos ese producto en el catálogo. Puedes crearlo nuevo más abajo.
              </p>
            ) : (
              catalogMatches.map((product) => (
                <form
                  key={product.id}
                  action={createOfferForProductAction}
                  className="flex flex-wrap items-end gap-4 rounded-lg border border-ink-border bg-ink p-4"
                >
                  <input type="hidden" name="productId" value={product.id} />

                  <div className="min-w-[10rem] flex-1">
                    <p className="text-xs uppercase tracking-wide text-paper/40">{product.brand}</p>
                    <p className="text-sm font-medium text-paper">{product.name}</p>
                    <p className="mt-0.5 text-xs text-paper/40">
                      {product.categoryLabel} ·{" "}
                      {product.offerCount === 1
                        ? "1 tienda lo vende"
                        : `${product.offerCount} tiendas lo venden`}
                    </p>
                  </div>

                  <label className="text-xs text-paper/60">
                    Tu precio (RD$)
                    <input
                      type="number"
                      name="price"
                      min={1}
                      step={1}
                      required
                      className="mt-1 block w-28 rounded-lg border border-ink-border bg-ink-soft px-2 py-1.5 text-sm text-paper outline-none focus:border-teal"
                    />
                  </label>

                  <label className="text-xs text-paper/60">
                    Inventario
                    <input
                      type="number"
                      name="quantity"
                      min={0}
                      step={1}
                      defaultValue={0}
                      required
                      className="mt-1 block w-24 rounded-lg border border-ink-border bg-ink-soft px-2 py-1.5 text-sm text-paper outline-none focus:border-teal"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light"
                  >
                    Agregar
                  </button>
                </form>
              ))
            )}
          </div>
        )}
      </section>

      <section className="rounded-card border border-ink-border bg-ink-soft p-5">
        <h2 className="font-display text-lg text-paper">Crear un producto nuevo</h2>
        <p className="mt-1 text-sm text-paper/60">
          Úsalo solo si el producto no existe todavía en DeUna.
        </p>

        <form action={createProductAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-paper/60">
            Nombre
            <input
              name="name"
              required
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            />
          </label>

          <label className="text-xs text-paper/60">
            Marca
            <input
              name="brand"
              required
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            />
          </label>

          <label className="text-xs text-paper/60 sm:col-span-2">
            Descripción
            <textarea
              name="description"
              required
              rows={3}
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            />
          </label>

          <label className="text-xs text-paper/60">
            Categoría
            <select
              name="categorySlug"
              required
              defaultValue=""
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {Object.values(CATEGORY_RULES).map((rule) => (
                <option key={rule.slug} value={rule.slug}>
                  {rule.emoji} {rule.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-paper/60">
            Imagen (URL, opcional)
            <input
              name="imageUrl"
              type="url"
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            />
          </label>

          <label className="text-xs text-paper/60">
            Precio (RD$)
            <input
              name="price"
              type="number"
              min={1}
              step={1}
              required
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            />
          </label>

          <label className="text-xs text-paper/60">
            Inventario inicial
            <input
              name="quantity"
              type="number"
              min={0}
              step={1}
              defaultValue={0}
              required
              className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
            />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-light"
            >
              Crear producto
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
