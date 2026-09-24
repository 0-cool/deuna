"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NearbyMerchant, ProductSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { useFavorites } from "@/lib/favorites";
import { FavoriteButton } from "../FavoriteButton";
import { QuickAddButton } from "../QuickAddButton";
import { storeCover } from "@/lib/store-covers";

type FilterKey = "all" | "stores" | "products";

function reviewsFor(name: string, rating: number) {
  return Math.round(rating * 180 + name.length * 17);
}

export function ProfileFavorites({
  merchants,
  products,
}: {
  merchants: NearbyMerchant[];
  products: ProductSummary[];
}) {
  const { merchants: favMerchants, products: favProducts } = useFavorites();
  const [filter, setFilter] = useState<FilterKey>("all");

  const stores = useMemo(() => {
    return favMerchants.map((fav) => merchants.find((item) => item.id === fav.id) ?? {
      ...fav,
      distanceKm: 0,
      isOpen: true,
    });
  }, [favMerchants, merchants]);

  const items = useMemo(() => {
    return favProducts.map((fav) => products.find((item) => item.id === fav.id) ?? {
      ...fav,
      category: fav.brand,
      categorySlug: "",
      requiresAgeVerification: fav.ageRestricted,
      offerCount: 1,
      quickOffer: null,
    });
  }, [favProducts, products]);

  const showStores = filter === "all" || filter === "stores";
  const showProducts = filter === "all" || filter === "products";

  return (
    <section>
      <h1 className="font-display text-3xl text-paper">Favoritos</h1>
      <p className="mt-1 text-sm text-paper/55">
        Guarda tus tiendas y productos favoritos para encontrarlos más rápido.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(
          [
            ["all", `Todos (${stores.length + items.length})`],
            ["stores", `Tiendas (${stores.length})`],
            ["products", `Productos (${items.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-sm ${
              filter === key ? "bg-teal text-paper" : "border border-ink-border bg-ink-soft text-paper/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {stores.length === 0 && items.length === 0 && (
        <div className="mt-8 rounded-card border border-dashed border-ink-border bg-ink-soft p-8 text-center">
          <p className="text-paper/80">Todavía no tienes favoritos.</p>
          <p className="mt-1 text-sm text-paper/50">Toca el corazón en una tienda o producto para guardarlo aquí.</p>
          <Link href="/tiendas" className="mt-4 inline-flex rounded-full bg-teal px-4 py-2 text-sm text-paper">
            Explorar tiendas
          </Link>
        </div>
      )}

      {showStores && stores.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-paper">Tiendas favoritas</h2>
            <Link href="/tiendas" className="text-sm text-teal-light hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stores.map((store) => (
              <article key={store.id} className="overflow-hidden rounded-card border border-ink-border bg-ink-soft">
                <div className="relative h-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={storeCover(store.slug)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <FavoriteButton merchant={store} className="absolute right-2 top-2" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-teal font-display text-paper">
                      {store.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        store.name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-paper">{store.name}</p>
                      <p className="text-xs text-paper/45">Licores · Snacks</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-paper/60">
                    <span className="text-gold">★</span> {store.rating.toFixed(1)} ({reviewsFor(store.name, store.rating)})
                    {" · "}
                    {Math.max(10, store.etaMinutes - 10)}–{store.etaMinutes + 5} min
                  </p>
                  <Link
                    href={`/tiendas/${store.slug}`}
                    className="mt-3 inline-flex rounded-full bg-teal px-4 py-2 text-sm text-paper hover:bg-teal-light"
                  >
                    Ver tienda
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {showProducts && items.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-paper">Productos favoritos</h2>
            <Link href="/buscar" className="text-sm text-teal-light hover:underline">
              Ver más
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {items.map((product) => (
              <article key={product.id} className="flex flex-col rounded-card border border-ink-border bg-ink-soft p-3">
                <div className="relative overflow-hidden rounded-xl bg-ink">
                  <Link href={`/productos/${product.slug}`} className="block aspect-square">
                    {product.imageUrl || product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl ?? product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">🍾</div>
                    )}
                  </Link>
                  <FavoriteButton product={product} className="absolute right-2 top-2" />
                </div>
                <Link href={`/productos/${product.slug}`} className="mt-3 line-clamp-2 text-sm font-medium text-paper">
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-paper/45">{product.brand}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <p className="font-display text-paper">
                    {formatDOP(product.quickOffer?.unitPrice ?? product.lowestPrice)}
                  </p>
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
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
