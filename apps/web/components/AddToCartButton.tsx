"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

interface Props {
  offerId: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  merchantId: string;
  merchantName: string;
  unitPrice: number;
  deliveryFee: number;
  ageRestricted: boolean;
}

export function AddToCartButton(props: Props) {
  const { addItem, merchantId } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function attemptAdd(replace = false) {
    const result = addItem(
      {
        offerId: props.offerId,
        productId: props.productId,
        productName: props.productName,
        productImageUrl: props.productImageUrl,
        merchantId: props.merchantId,
        merchantName: props.merchantName,
        unitPrice: props.unitPrice,
        quantity,
        ageRestricted: props.ageRestricted,
      },
      props.deliveryFee,
      { replace },
    );

    if (result === "blocked_other_merchant") {
      setConfirming(true);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (confirming) {
    return (
      <div className="rounded-lg border border-coral/40 bg-coral/10 p-3 text-sm text-paper">
        <p>
          Tu carrito tiene productos de otra tienda. En este MVP, un pedido es de un solo
          comercio. ¿Vaciar el carrito y agregar este producto?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => {
              attemptAdd(true);
              setConfirming(false);
            }}
            className="rounded-md bg-teal px-3 py-1.5 text-paper"
          >
            Vaciar y agregar
          </button>
          <button
            onClick={() => {
              router.push("/carrito");
              setConfirming(false);
            }}
            className="rounded-md border border-ink-border px-3 py-1.5 text-paper/80"
          >
            Ver carrito actual
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-md border border-ink-border px-3 py-1.5 text-paper/80"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-lg border border-ink-border">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-1.5 text-paper/70"
          aria-label="Reducir cantidad"
        >
          −
        </button>
        <span className="w-8 text-center text-paper">{quantity}</span>
        <button
          onClick={() => setQuantity((q) => q + 1)}
          className="px-3 py-1.5 text-paper/70"
          aria-label="Aumentar cantidad"
        >
          +
        </button>
      </div>
      <button
        onClick={() => attemptAdd()}
        disabled={Boolean(merchantId) && merchantId !== props.merchantId && false}
        className="flex-1 rounded-lg bg-teal px-4 py-2 font-medium text-paper transition hover:bg-teal-light"
      >
        {added ? "Agregado ✓" : "Agregar al carrito"}
      </button>
    </div>
  );
}
