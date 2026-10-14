import Link from "next/link";
import type { ProductSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { ProductImageSlider } from "./ProductImageSlider";
import { QuickAddButton } from "./QuickAddButton";
import { FavoriteButton } from "./FavoriteButton";

export function ProductCard({
  product,
  showQuickAdd = true,
  quickAddLabel = "Agregar",
}: {
  product: ProductSummary;
  showQuickAdd?: boolean;
  quickAddLabel?: string;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-ink-border bg-ink-soft transition hover:border-teal">
      <ProductImageSlider
        images={product.images}
        name={product.name}
        compact
        fit="contain"
        controls={false}
        ageRestricted={product.ageRestricted}
        href={`/productos/${product.slug}`}
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-paper/40">{product.brand}</p>
          <FavoriteButton product={product} className="h-7 w-7 bg-transparent" />
        </div>
        <Link href={`/productos/${product.slug}`} className="line-clamp-2 text-sm font-medium text-paper">
          {product.name}
        </Link>
        {product.ageRestricted && (
          <span className="w-fit rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-medium text-coral">
            🔞 +18
          </span>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <p className="font-display text-lg text-paper">
              {product.quickOffer ? formatDOP(product.quickOffer.unitPrice) : `Desde ${formatDOP(product.lowestPrice)}`}
            </p>
            {product.offerCount > 1 && (
              <span className="text-xs text-paper/50">{product.offerCount} tiendas</span>
            )}
          </div>
          {showQuickAdd && product.quickOffer && (
            <QuickAddButton
              productId={product.id}
              productName={product.name}
              productImageUrl={product.imageUrl}
              ageRestricted={product.ageRestricted}
              offer={product.quickOffer}
              label={quickAddLabel}
            />
          )}
        </div>
      </div>
    </article>
  );
}
