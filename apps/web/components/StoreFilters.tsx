"use client";

import { useMemo, useState } from "react";
import type { NearbyMerchant } from "@deuna/types";
import { MerchantGrid } from "./NearbyStores";

type SortKey = "distance" | "rating" | "eta" | "fee";

export function StoreFilters({ merchants }: { merchants: NearbyMerchant[] }) {
  const [openOnly, setOpenOnly] = useState(false);
  const [minRating, setMinRating] = useState("all");
  const [maxDistance, setMaxDistance] = useState("all");
  const [sort, setSort] = useState<SortKey>("distance");

  const filtered = useMemo(() => {
    const next = merchants.filter((merchant) => {
      if (openOnly && !merchant.isOpen) return false;
      if (minRating !== "all" && merchant.rating < Number(minRating)) return false;
      if (maxDistance !== "all" && merchant.distanceKm > Number(maxDistance)) return false;
      return true;
    });
    next.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "eta") return a.etaMinutes - b.etaMinutes;
      if (sort === "fee") return a.deliveryFee - b.deliveryFee;
      return a.distanceKm - b.distanceKm;
    });
    return next;
  }, [merchants, openOnly, minRating, maxDistance, sort]);

  return (
    <div>
      <div className="rounded-card border border-ink-border bg-ink-soft p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-paper/80">
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
            Solo abiertas
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          >
            <option value="all">Cualquier rating</option>
            <option value="4.5">4.5+</option>
            <option value="4.7">4.7+</option>
            <option value="4.8">4.8+</option>
          </select>
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          >
            <option value="all">Cualquier distancia</option>
            <option value="5">Hasta 5 km</option>
            <option value="10">Hasta 10 km</option>
            <option value="15">Hasta 15 km</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          >
            <option value="distance">Más cerca</option>
            <option value="rating">Mejor rating</option>
            <option value="eta">Más rápido</option>
            <option value="fee">Delivery más barato</option>
          </select>
        </div>
      </div>
      <p className="mt-4 text-sm text-paper/50">
        {filtered.length} {filtered.length === 1 ? "tienda" : "tiendas"}
      </p>
      <div className="mt-4">
        <MerchantGrid merchants={filtered} />
      </div>
    </div>
  );
}
