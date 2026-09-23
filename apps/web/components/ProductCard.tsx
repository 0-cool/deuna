import Link from "next/link";
import type { ProductSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/productos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-ink-border bg-ink-soft transition hover:border-teal"
    >
      <div className="flex aspect-square items-center justify-center bg-ink text-4xl">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-[350px] w-full object-cover" />
        ) : (
          <span aria-hidden>🍾</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs uppercase tracking-wide text-paper/40">{product.brand}</p>
        <p className="line-clamp-2 text-sm font-medium text-paper">{product.name}</p>
        {product.ageRestricted && (
          <span className="w-fit rounded-full bg-coral/15 px-2 py-0.5 text-[11px] font-medium text-coral">
            🔞 +18
          </span>
        )}
        <div className="mt-auto flex items-baseline justify-between pt-2">
          <p className="font-display text-lg text-paper">Desde {formatDOP(product.lowestPrice)}</p>
          {product.offerCount > 1 && (
            <span className="text-xs text-paper/50">{product.offerCount} tiendas</span>
          )}
        </div>
      </div>
    </Link>
  );
}
