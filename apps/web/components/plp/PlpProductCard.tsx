import Link from "next/link";
import type { ProductSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { ProductImageSlider } from "../ProductImageSlider";
import { QuickAddButton } from "../QuickAddButton";
import { FavoriteButton } from "../FavoriteButton";

export function PlpProductCard({ product }: { product: ProductSummary }) {
  const price = product.quickOffer?.unitPrice ?? product.lowestPrice;

  return (
    <article className="group flex flex-col rounded-card border border-ink-border bg-ink-soft p-3 transition hover:border-teal">
      <div className="relative overflow-hidden rounded-xl bg-ink">
        <FavoriteButton product={product} className="absolute right-2 top-2 z-10" />
        <ProductImageSlider
          images={product.images}
          name={product.name}
          compact
          fit="contain"
          controls={false}
          ageRestricted={product.ageRestricted}
          href={`/productos/${product.slug}`}
        />
      </div>
      <Link href={`/productos/${product.slug}`} className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-paper">
        {product.name}
      </Link>
      <p className="mt-1 text-xs text-paper/45">{product.brand}</p>
      {product.ageRestricted && (
        <span className="mt-1 w-fit rounded-full bg-coral/15 px-2 py-0.5 text-[10px] font-medium text-coral">
          +18
        </span>
      )}
      <div className="mt-auto flex items-center justify-between pt-3">
        <p className="font-display text-lg text-paper">{formatDOP(price)}</p>
        {product.quickOffer && (
          <QuickAddButton
            productId={product.id}
            productName={product.name}
            productImageUrl={product.imageUrl}
            ageRestricted={product.ageRestricted}
            offer={product.quickOffer}
            variant="icon"
          />
        )}
      </div>
    </article>
  );
}
