"use client";

import { useState } from "react";
import type { ProductQuickOffer } from "@deuna/types";
import { useCart } from "@/lib/cart-context";

export function QuickAddButton({
  productId,
  productName,
  productImageUrl,
  ageRestricted,
  offer,
  label = "Agregar",
  variant = "label",
}: {
  productId: string;
  productName: string;
  productImageUrl: string | null;
  ageRestricted: boolean;
  offer: ProductQuickOffer;
  label?: string;
  variant?: "label" | "icon";
}) {
  const { addItem } = useCart();
  const [state, setState] = useState<"idle" | "confirm" | "added">("idle");

  function add(replace = false) {
    const result = addItem(
      {
        offerId: offer.offerId,
        productId,
        productName,
        productImageUrl,
        merchantId: offer.merchantId,
        merchantName: offer.merchantName,
        unitPrice: offer.unitPrice,
        quantity: 1,
        ageRestricted,
      },
      offer.deliveryFee,
      { replace },
    );
    if (result === "blocked_other_merchant") {
      setState("confirm");
      return;
    }
    setState("added");
    setTimeout(() => setState("idle"), 1400);
  }

  if (!offer.inStock || !offer.merchantIsOpen) {
    return (
      <span className="rounded-full bg-paper/10 px-3 py-1.5 text-xs text-paper/50">
        {offer.merchantIsOpen ? "Agotado" : "Tienda cerrada"}
      </span>
    );
  }

  if (state === "confirm") {
    return (
      <div className="rounded-lg border border-coral/40 bg-coral/10 p-2 text-xs text-paper">
        <p>Esto vacía el carrito de otra tienda.</p>
        <div className="mt-1 flex gap-1">
          <button type="button" onClick={() => add(true)} className="rounded bg-teal px-2 py-1">
            Reemplazar
          </button>
          <button type="button" onClick={() => setState("idle")} className="rounded border border-ink-border px-2 py-1">
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        add();
      }}
      className={
        variant === "icon"
          ? "flex h-9 w-9 items-center justify-center rounded-full bg-teal text-lg font-medium text-paper transition hover:bg-teal-light"
          : "rounded-full bg-teal px-3 py-1.5 text-xs font-medium text-paper hover:bg-teal-light"
      }
      aria-label={label}
    >
      {variant === "icon" ? (state === "added" ? "✓" : "+") : state === "added" ? "Agregado ✓" : label}
    </button>
  );
}
