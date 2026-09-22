import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantOfferDetail } from "@/lib/merchant-data";
import { CATEGORY_RULES } from "@deuna/config";
import { updateProductAction } from "../../../../actions";

export const dynamic = "force-dynamic";

export default async function EditMerchantProductPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const { offerId } = await params;
  const offer = await getMerchantOfferDetail(merchant.id, offerId);
  if (!offer) notFound();

  const locked = offer.sharedWithOtherMerchants;

  return (
    <div>
      <Link href="/merchant/productos" className="text-xs text-paper/50 hover:text-paper">
        ← Volver a productos
      </Link>
      <h1 className="mt-2 font-display text-2xl text-paper">Editar producto</h1>

      {locked && (
        <p className="mt-3 rounded-card border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          Otras tiendas también venden este producto, así que el nombre, marca, categoría,
          descripción e imagen están bloqueados aquí — solo puedes ajustar tu precio, inventario y
          disponibilidad.
        </p>
      )}

      <form action={updateProductAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="offerId" value={offer.id} />

        <label className="text-xs text-paper/60">
          Nombre
          <input
            name="name"
            defaultValue={offer.name}
            required
            disabled={locked}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal disabled:opacity-50"
          />
        </label>

        <label className="text-xs text-paper/60">
          Marca
          <input
            name="brand"
            defaultValue={offer.brand}
            required
            disabled={locked}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal disabled:opacity-50"
          />
        </label>

        <label className="text-xs text-paper/60 sm:col-span-2">
          Descripción
          <textarea
            name="description"
            defaultValue={offer.description}
            required
            rows={3}
            disabled={locked}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal disabled:opacity-50"
          />
        </label>

        <label className="text-xs text-paper/60">
          Categoría
          <select
            name="categorySlug"
            defaultValue={offer.categorySlug}
            required
            disabled={locked}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal disabled:opacity-50"
          >
            {Object.values(CATEGORY_RULES).map((rule) => (
              <option key={rule.slug} value={rule.slug}>
                {rule.emoji} {rule.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-paper/60">
          Imagen (URL)
          <input
            name="imageUrl"
            type="url"
            defaultValue={offer.imageUrl}
            disabled={locked}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal disabled:opacity-50"
          />
        </label>

        <label className="text-xs text-paper/60">
          Precio (RD$)
          <input
            name="price"
            type="number"
            min={1}
            step={1}
            defaultValue={offer.price}
            required
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="text-xs text-paper/60">
          Inventario
          <input
            name="quantity"
            type="number"
            min={0}
            step={1}
            defaultValue={offer.quantity}
            required
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-paper/60">
          <input
            type="checkbox"
            name="isAvailable"
            defaultChecked={offer.isAvailable}
            className="h-4 w-4"
          />
          Disponible
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-light"
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
