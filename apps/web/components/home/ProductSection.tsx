"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProductSummary } from "@deuna/types";
import { ProductCard } from "../ProductCard";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "plus18", label: "+18" },
  { id: "fast", label: "Entrega rápida" },
  { id: "hielo", label: "Hielo" },
  { id: "mixers", label: "Mixers" },
  { id: "snacks", label: "Snacks" },
] as const;

export function ProductSection({ products }: { products: ProductSummary[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    return products.filter((product) => {
      if (filter === "plus18") return product.ageRestricted;
      if (filter === "fast") return !product.ageRestricted || product.offerCount > 0;
      if (filter === "hielo") return product.categorySlug === "hielo" || product.category.toLowerCase().includes("hielo");
      if (filter === "mixers") return product.categorySlug === "mixers" || product.category.toLowerCase().includes("mixer");
      if (filter === "snacks")
        return product.categorySlug === "snacks" || product.categorySlug === "fiestas";
      return true;
    });
  }, [products, filter]);

  return (
    <section className="mt-12 pb-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-paper">Populares ahora</h2>
          <p className="mt-1 text-sm text-paper/50">Lo más pedido en Santo Domingo.</p>
        </div>
        <Link href="/buscar" className="shrink-0 text-sm text-teal-light hover:underline">
          Ver todo →
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={
              filter === item.id
                ? "rounded-full bg-teal px-4 py-1.5 text-sm text-paper"
                : "rounded-full border border-ink-border bg-ink-soft px-4 py-1.5 text-sm text-paper/70 hover:border-teal"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-3">
        {filtered.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} quickAddLabel="Agregar rápido" />
        ))}
      </div>
    </section>
  );
}
