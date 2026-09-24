"use client";

import { useFavorites } from "@/lib/favorites";
import type { FavoriteMerchant, FavoriteProduct, NearbyMerchant, ProductSummary } from "@deuna/types";

export function FavoriteButton({
  merchant,
  product,
  className = "",
}: {
  merchant?: NearbyMerchant | FavoriteMerchant;
  product?: ProductSummary | FavoriteProduct;
  className?: string;
}) {
  const { isMerchantFav, isProductFav, toggleMerchant, toggleProduct } = useFavorites();
  const active = merchant ? isMerchantFav(merchant.id) : product ? isProductFav(product.id) : false;

  return (
    <button
      type="button"
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (merchant) toggleMerchant(merchant);
        if (product) toggleProduct(product);
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-sm backdrop-blur ${
        active ? "text-coral" : "text-paper/70"
      } ${className}`}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
