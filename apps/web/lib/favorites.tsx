"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FavoriteMerchant, FavoriteProduct, NearbyMerchant, ProductSummary } from "@deuna/types";
import { getFavorites, toggleFavoriteMerchant, toggleFavoriteProduct } from "./customer-storage";

function toFavoriteMerchant(merchant: NearbyMerchant | FavoriteMerchant): FavoriteMerchant {
  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    logoUrl: merchant.logoUrl,
    rating: merchant.rating,
    etaMinutes: merchant.etaMinutes,
    deliveryFee: merchant.deliveryFee,
  };
}

function toFavoriteProduct(product: ProductSummary | FavoriteProduct): FavoriteProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    images: "images" in product ? product.images : product.imageUrl ? [product.imageUrl] : [],
    ageRestricted: product.ageRestricted,
    lowestPrice: product.lowestPrice,
  };
}

const FavoritesContext = createContext<{
  merchants: FavoriteMerchant[];
  products: FavoriteProduct[];
  isMerchantFav: (id: string) => boolean;
  isProductFav: (id: string) => boolean;
  toggleMerchant: (merchant: NearbyMerchant | FavoriteMerchant) => void;
  toggleProduct: (product: ProductSummary | FavoriteProduct) => void;
} | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ merchants: FavoriteMerchant[]; products: FavoriteProduct[] }>({
    merchants: [],
    products: [],
  });

  useEffect(() => {
    setState(getFavorites());
  }, []);

  const value = useMemo(
    () => ({
      merchants: state.merchants,
      products: state.products,
      isMerchantFav: (id: string) => state.merchants.some((item) => item.id === id),
      isProductFav: (id: string) => state.products.some((item) => item.id === id),
      toggleMerchant: (merchant: NearbyMerchant | FavoriteMerchant) => {
        toggleFavoriteMerchant(toFavoriteMerchant(merchant));
        setState(getFavorites());
      },
      toggleProduct: (product: ProductSummary | FavoriteProduct) => {
        toggleFavoriteProduct(toFavoriteProduct(product));
        setState(getFavorites());
      },
    }),
    [state],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}

export { toFavoriteMerchant, toFavoriteProduct };
