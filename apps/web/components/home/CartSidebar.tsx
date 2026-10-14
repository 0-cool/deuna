"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatDOP } from "@deuna/utils";

export function CartSidebar({ ctaLabel = "Ir a checkout" }: { ctaLabel?: string }) {
  const { items, setQuantity, subtotal, deliveryFee, serviceFee, total, fulfillment, setFulfillment } =
    useCart();

  return (
    <aside className="rounded-card border border-ink-border bg-ink-soft p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-paper">Tu pedido</h2>
          <p className="mt-1 text-sm text-paper/55">
            {items[0]?.merchantName ?? "Elige una tienda y arma tu noche"}
          </p>
        </div>
        <Link href="/tiendas" className="text-xs text-teal-light hover:underline">
          Cambiar tienda
        </Link>
      </div>

      {items[0] && (
        <p className="mt-3 inline-flex rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-medium text-teal-light">
          Abierto · {items[0].merchantName}
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-paper/50">
          Todavía no hay nada aquí. Agrega hielo, mixers o lo que falte para hoy.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={item.offerId} className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-ink">
                {item.productImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.productImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-lg">🍾</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-paper">{item.productName}</p>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.offerId, item.quantity - 1)}
                    className="h-6 w-6 rounded-full border border-ink-border text-paper/70"
                  >
                    −
                  </button>
                  <span className="w-4 text-center text-sm text-paper">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.offerId, item.quantity + 1)}
                    className="h-6 w-6 rounded-full border border-ink-border text-paper/70"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-sm text-paper">{formatDOP(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid grid-cols-2 rounded-full bg-ink p-1">
        <button
          type="button"
          onClick={() => setFulfillment("DELIVERY")}
          className={
            fulfillment === "DELIVERY"
              ? "rounded-full bg-teal py-2 text-sm text-paper"
              : "rounded-full py-2 text-sm text-paper/55"
          }
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => setFulfillment("PICKUP")}
          className={
            fulfillment === "PICKUP"
              ? "rounded-full bg-teal py-2 text-sm text-paper"
              : "rounded-full py-2 text-sm text-paper/55"
          }
        >
          Paso a recoger
        </button>
      </div>

      <div className="mt-5 space-y-1.5 text-sm text-paper/65">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatDOP(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>{fulfillment === "PICKUP" ? "Recoger en tienda" : "Delivery (15–25 min)"}</span>
          <span>{fulfillment === "PICKUP" ? "Gratis" : formatDOP(deliveryFee)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tarifa de servicio (2.5%)</span>
          <span>{formatDOP(serviceFee)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-border pt-3 font-display text-xl text-paper">
          <span>Total</span>
          <span>{formatDOP(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-5 block rounded-full bg-teal py-3 text-center font-medium text-paper transition hover:bg-teal-light"
      >
        {ctaLabel}
      </Link>
    </aside>
  );
}
