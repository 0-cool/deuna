"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatDOP } from "@deuna/utils";

export default function CartPage() {
  const { items, merchantId, setQuantity, removeItem, subtotal, deliveryFee, serviceFee, total } =
    useCart();

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 font-display text-2xl text-paper">Tu carrito está vacío</h1>
        <p className="mt-2 text-paper/60">Busca lo que necesitas y agrégalo desde la tienda más cercana.</p>
        <Link
          href="/buscar"
          className="mt-6 inline-block rounded-full bg-teal px-6 py-3 font-medium text-paper hover:bg-teal-light"
        >
          Ver productos
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl text-paper">Tu carrito</h1>
      <p className="mt-1 text-sm text-paper/60">
        Comprando en <span className="text-paper/90">{items[0]?.merchantName}</span>
      </p>

      <ul className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.offerId}
            className="flex items-center gap-4 rounded-card border border-ink-border bg-ink-soft p-4"
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-xl">
              🍾
            </div>
            <div className="flex-1">
              <p className="font-medium text-paper">{item.productName}</p>
              <p className="text-sm text-paper/60">{formatDOP(item.unitPrice)} c/u</p>
            </div>
            <div className="flex items-center rounded-lg border border-ink-border">
              <button
                onClick={() => setQuantity(item.offerId, item.quantity - 1)}
                className="px-3 py-1.5 text-paper/70"
                aria-label="Reducir cantidad"
              >
                −
              </button>
              <span className="w-8 text-center text-paper">{item.quantity}</span>
              <button
                onClick={() => setQuantity(item.offerId, item.quantity + 1)}
                className="px-3 py-1.5 text-paper/70"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(item.offerId)}
              className="text-sm text-paper/40 hover:text-coral"
              aria-label="Quitar producto"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-card border border-ink-border bg-ink-soft p-5">
        <div className="flex justify-between text-sm text-paper/70">
          <span>Subtotal</span>
          <span>{formatDOP(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-paper/70">
          <span>Delivery</span>
          <span>{formatDOP(deliveryFee)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-paper/70">
          <span>Service fee</span>
          <span>{formatDOP(serviceFee)}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-ink-border pt-4 font-display text-xl text-paper">
          <span>Total</span>
          <span>{formatDOP(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block rounded-full bg-teal px-6 py-3 text-center font-medium text-paper hover:bg-teal-light"
      >
        Ir a checkout
      </Link>
    </section>
  );
}
