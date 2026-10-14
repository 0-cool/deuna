"use client";

import { useMemo, useState } from "react";
import type { ProductSummary } from "@deuna/types";
import { ProductCard } from "./ProductCard";

type SortKey = "relevance" | "price-asc" | "price-desc" | "name";

export function CatalogFilters({
  products,
  showCategoryFilter = false,
}: {
  products: ProductSummary[];
  showCategoryFilter?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [sort, setSort] = useState<SortKey>("relevance");

  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort(),
    [products],
  );
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const next = products.filter((product) => {
      const matchesQuery =
        !query.trim() ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase());
      const matchesBrand = brand === "all" || product.brand === brand;
      const matchesCategory = category === "all" || product.category === category;
      const price = product.quickOffer?.unitPrice ?? product.lowestPrice;
      const matchesPrice =
        maxPrice === "all" ||
        (maxPrice === "500" && price <= 500) ||
        (maxPrice === "1000" && price <= 1000) ||
        (maxPrice === "2000" && price <= 2000) ||
        (maxPrice === "2001" && price > 2000);
      return matchesQuery && matchesBrand && matchesCategory && matchesPrice;
    });

    next.sort((a, b) => {
      const priceA = a.quickOffer?.unitPrice ?? a.lowestPrice;
      const priceB = b.quickOffer?.unitPrice ?? b.lowestPrice;
      if (sort === "price-asc") return priceA - priceB;
      if (sort === "price-desc") return priceB - priceA;
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      return 0;
    });
    return next;
  }, [products, query, brand, category, maxPrice, sort]);

  return (
    <div>
      <div className="rounded-card border border-ink-border bg-ink-soft p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por nombre o marca"
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          >
            <option value="all">Todas las marcas</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {showCategoryFilter && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          >
            <option value="all">Cualquier precio</option>
            <option value="500">Hasta RD$500</option>
            <option value="1000">Hasta RD$1,000</option>
            <option value="2000">Hasta RD$2,000</option>
            <option value="2001">Más de RD$2,000</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          >
            <option value="relevance">Orden: relevancia</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-paper/50">
        {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 text-paper/60">No hay productos con esos filtros.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
