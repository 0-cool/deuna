"use client";

import { useMemo, useState } from "react";
import { CATEGORY_RULES } from "@deuna/config";
import type { ProductSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import { Breadcrumbs } from "../Breadcrumbs";
import { CartSidebar } from "../home/CartSidebar";
import { PlpProductCard } from "./PlpProductCard";

const STORE_COVER = "/hero-banner.jpg?v=2";

type SortKey = "popular" | "price-asc" | "price-desc" | "name";

export function PlpCatalog({
  products,
  title,
  crumbs,
  store,
  activeCategory,
}: {
  products: ProductSummary[];
  title: string;
  crumbs: { href?: string; label: string }[];
  store?: {
    name: string;
    slug: string;
    rating: number;
    etaMinutes: number;
    isOpen: boolean;
    address?: string | null;
    deliveryFee?: number;
    logoUrl?: string | null;
  };
  activeCategory?: string;
}) {
  const prices = products.map((p) => p.quickOffer?.unitPrice ?? p.lowestPrice);
  const maxFound = Math.max(500, ...prices, 0);
  const [category, setCategory] = useState(activeCategory ?? "all");
  const [brands, setBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(maxFound);
  const [sort, setSort] = useState<SortKey>("popular");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const availableCategories = useMemo(() => {
    const present = new Set(products.map((product) => product.categorySlug));
    return Object.values(CATEGORY_RULES).filter((item) => present.has(item.slug));
  }, [products]);

  const brandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      if (category !== "all" && product.categorySlug !== category) continue;
      map.set(product.brand, (map.get(product.brand) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [products, category]);

  const filtered = useMemo(() => {
    const next = products.filter((product) => {
      const price = product.quickOffer?.unitPrice ?? product.lowestPrice;
      const matchesCategory = category === "all" || product.categorySlug === category;
      const matchesBrand = brands.length === 0 || brands.includes(product.brand);
      return matchesCategory && matchesBrand && price <= maxPrice;
    });
    next.sort((a, b) => {
      const priceA = a.quickOffer?.unitPrice ?? a.lowestPrice;
      const priceB = b.quickOffer?.unitPrice ?? b.lowestPrice;
      if (sort === "price-asc") return priceA - priceB;
      if (sort === "price-desc") return priceB - priceA;
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      return b.offerCount - a.offerCount;
    });
    return next;
  }, [products, category, brands, maxPrice, sort]);

  function toggleBrand(brand: string) {
    setBrands((prev) => (prev.includes(brand) ? prev.filter((item) => item !== brand) : [...prev, brand]));
  }

  function selectCategory(next: string) {
    setCategory(next);
    setBrands([]);
  }

  const heading = category === "all"
    ? store
      ? "Todos los productos"
      : title
    : CATEGORY_RULES[category as keyof typeof CATEGORY_RULES]?.label ?? title;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8">
      <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)_320px]">
        <aside className={`rounded-card border border-ink-border bg-ink-soft p-4 ${filtersOpen ? "block" : "hidden lg:block"}`}>
          <p className="font-display text-xl text-paper">{title}</p>
          <p className="mt-1 text-xs text-paper/45">
            {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          </p>

          <nav className="mt-5 space-y-1">
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${
                category === "all" ? "bg-teal/15 font-medium text-teal-light" : "text-paper/70 hover:bg-ink"
              }`}
            >
              Todos
            </button>
            {availableCategories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => selectCategory(item.slug)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  category === item.slug ? "bg-teal/15 font-medium text-teal-light" : "text-paper/70 hover:bg-ink"
                }`}
              >
                <span>
                  {item.emoji} {item.label}
                </span>
                {item.requiresAgeVerification && <span className="text-[10px] text-coral">+18</span>}
              </button>
            ))}
          </nav>

          <div className="mt-6 border-t border-ink-border pt-4">
            <p className="text-sm font-medium text-paper">Filtros</p>
            <label className="mt-3 block text-xs text-paper/50">
              Precio · RD$0 – {formatDOP(maxPrice)}
              <input
                type="range"
                min={0}
                max={maxFound}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-2 w-full accent-teal"
              />
            </label>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-paper">Marca</p>
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
              {brandCounts.map(([brand, count]) => (
                <label key={brand} className="flex items-center gap-2 text-sm text-paper/75">
                  <input
                    type="checkbox"
                    checked={brands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="accent-teal"
                  />
                  <span className="flex-1 truncate">{brand}</span>
                  <span className="text-xs text-paper/40">({count})</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          {store && (
            <div className="overflow-hidden rounded-card border border-ink-border">
              <div className="relative h-44 md:h-52">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={STORE_COVER}
                  alt=""
                  className="h-full w-full object-cover object-[center_35%]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-transparent" />
                <div className="absolute inset-0 flex items-center gap-4 px-5 md:px-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal/40 bg-teal font-display text-2xl text-paper">
                    {store.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      store.name.slice(0, 1)
                    )}
                  </div>
                  <div>
                    <h1 className="font-display text-3xl text-paper md:text-4xl">{store.name}</h1>
                    <p className="mt-1 text-sm text-paper/75">
                      ⭐ {store.rating.toFixed(1)} · {store.etaMinutes} min
                      {store.deliveryFee != null ? ` · Delivery ${formatDOP(store.deliveryFee)}` : ""}
                      {" · "}
                      {store.isOpen ? "Abierto" : "Cerrado"}
                    </p>
                    {store.address && <p className="mt-0.5 text-xs text-paper/50">{store.address}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="home-swiper mt-4 min-w-0 overflow-hidden">
            <Swiper
              modules={[FreeMode]}
              freeMode
              slidesPerView="auto"
              spaceBetween={8}
              watchOverflow
              className="overflow-hidden"
            >
              <SwiperSlide className="!w-auto">
                <button
                  type="button"
                  onClick={() => selectCategory("all")}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    category === "all" ? "bg-teal text-paper" : "border border-ink-border bg-ink-soft text-paper/70"
                  }`}
                >
                  Todos
                </button>
              </SwiperSlide>
              {availableCategories.map((item) => (
                <SwiperSlide key={item.slug} className="!w-auto">
                  <button
                    type="button"
                    onClick={() => selectCategory(item.slug)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      category === item.slug ? "bg-teal text-paper" : "border border-ink-border bg-ink-soft text-paper/70"
                    }`}
                  >
                    {item.label}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="mt-4">
            <Breadcrumbs items={crumbs} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-paper">{heading}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="rounded-full border border-ink-border px-3 py-1.5 text-sm text-paper lg:hidden"
              >
                {filtersOpen ? "Ocultar filtros" : "Filtros"}
              </button>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-ink-border bg-ink-soft px-3 py-1.5 text-sm text-paper"
              >
                <option value="popular">Más populares</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-10 text-paper/55">No hay productos con esos filtros.</p>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <PlpProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <div className="lg:sticky lg:top-24">
          <CartSidebar ctaLabel="Finalizar pedido" />
        </div>
      </div>
    </div>
  );
}
