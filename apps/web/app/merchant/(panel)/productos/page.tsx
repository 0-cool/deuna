import Link from "next/link";
import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantOffers } from "@/lib/merchant-data";
import { updateOfferAction, deleteOfferAction } from "../../actions";
import { DeleteOfferButton } from "@/components/merchant/DeleteOfferButton";

export const dynamic = "force-dynamic";

const NOTICE_LABELS: Record<string, string> = {
  created: "Producto agregado a tu catálogo.",
  updated: "Cambios guardados.",
  deleted: "Producto eliminado.",
  deactivated:
    "Ese producto tiene pedidos asociados, así que lo desactivamos en vez de eliminarlo — ya no aparece en tu tienda, pero el historial de pedidos queda intacto.",
};

export default async function MerchantProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const { notice } = await searchParams;
  const offers = await getMerchantOffers(merchant.id);
  const noticeLabel = notice ? NOTICE_LABELS[notice] : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-paper">Productos e inventario</h1>
          <p className="mt-1 text-sm text-paper/60">
            Actualiza precio, existencias y disponibilidad. Los cambios se ven de inmediato en la
            página del producto.
          </p>
        </div>
        <Link
          href="/merchant/productos/nuevo"
          className="whitespace-nowrap rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light"
        >
          + Agregar producto
        </Link>
      </div>

      {noticeLabel && (
        <p className="mt-4 rounded-card border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal-light">
          {noticeLabel}
        </p>
      )}

      {offers.length === 0 ? (
        <p className="mt-8 text-paper/60">Todavía no tienes productos cargados.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {offers.map((offer) => (
            <div key={offer.id} className="rounded-card border border-ink-border bg-ink-soft p-4">
              <form
                action={updateOfferAction}
                className="flex flex-wrap items-end gap-4"
              >
                <input type="hidden" name="offerId" value={offer.id} />

                <div className="min-w-[10rem] flex-1">
                  <p className="text-xs uppercase tracking-wide text-paper/40">{offer.brand}</p>
                  <p className="text-sm font-medium text-paper">{offer.productName}</p>
                </div>

                <label className="text-xs text-paper/60">
                  Precio (RD$)
                  <input
                    type="number"
                    name="price"
                    min={1}
                    step={1}
                    defaultValue={offer.price}
                    className="mt-1 block w-28 rounded-lg border border-ink-border bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-teal"
                  />
                </label>

                <label className="text-xs text-paper/60">
                  Inventario
                  <input
                    type="number"
                    name="quantity"
                    min={0}
                    step={1}
                    defaultValue={offer.quantity}
                    className="mt-1 block w-24 rounded-lg border border-ink-border bg-ink px-2 py-1.5 text-sm text-paper outline-none focus:border-teal"
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

                <button
                  type="submit"
                  className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light"
                >
                  Guardar
                </button>
              </form>

              <div className="mt-3 flex items-center gap-4 border-t border-ink-border pt-3">
                <Link
                  href={`/merchant/productos/${offer.id}/editar`}
                  className="text-xs font-medium text-paper/60 underline-offset-2 hover:text-paper hover:underline"
                >
                  Editar detalles del producto
                </Link>
                <DeleteOfferButton
                  offerId={offer.id}
                  productName={offer.productName}
                  action={deleteOfferAction}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
