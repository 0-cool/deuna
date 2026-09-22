"use client";

import { useState } from "react";
import type { ProductOfferSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { AddToCartButton } from "./AddToCartButton";

type SortOption = "price" | "distance" | "eta" | "rating";

const SORT_LABELS: Record<SortOption, string> = {
  price: "Precio",
  distance: "Distancia",
  eta: "Tiempo de entrega",
  rating: "Rating",
};

function sortOffers(offers: ProductOfferSummary[], sort: SortOption): ProductOfferSummary[] {
  const copy = [...offers];
  switch (sort) {
    case "price":
      return copy.sort((a, b) => a.price - b.price);
    case "distance":
      return copy.sort((a, b) => a.distanceKm - b.distanceKm);
    case "eta":
      return copy.sort((a, b) => a.etaMinutes - b.etaMinutes);
    case "rating":
      return copy.sort((a, b) => b.merchantRating - a.merchantRating);
  }
}

export function MerchantComparison({
  offers,
  productId,
  productName,
  productImageUrl,
  ageRestricted,
}: {
  offers: ProductOfferSummary[];
  productId: string;
  productName: string;
  productImageUrl: string | null;
  ageRestricted: boolean;
}) {
  const [sort, setSort] = useState<SortOption>("price");
  const sorted = sortOffers(offers, sort);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-paper">
          Disponible en {offers.length} {offers.length === 1 ? "tienda" : "tiendas"}
        </h2>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-lg border border-ink-border bg-ink-soft px-3 py-1.5 text-sm text-paper"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              Ordenar por {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {sorted.map((offer) => (
          <li
            key={offer.offerId}
            className="rounded-card border border-ink-border bg-ink-soft p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-paper">{offer.merchantName}</p>
                <p className="mt-1 text-sm text-paper/60">
                  ⭐ {offer.merchantRating.toFixed(1)} · {offer.distanceKm.toFixed(1)} km ·{" "}
                  {offer.etaMinutes} min · Delivery {formatDOP(offer.deliveryFee)}
                </p>
                {!offer.inStock && (
                  <p className="mt-1 text-sm text-coral">Agotado en este comercio</p>
                )}
              </div>
              <p className="font-display text-2xl text-paper">{formatDOP(offer.price)}</p>
            </div>

            {offer.inStock && (
              <div className="mt-3">
                <AddToCartButton
                  offerId={offer.offerId}
                  productId={productId}
                  productName={productName}
                  productImageUrl={productImageUrl}
                  merchantId={offer.merchantId}
                  merchantName={offer.merchantName}
                  unitPrice={offer.price}
                  deliveryFee={offer.deliveryFee}
                  ageRestricted={ageRestricted}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
