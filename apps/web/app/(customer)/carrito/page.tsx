"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { formatDOP } from "@deuna/utils";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { hoursLeft } from "@/lib/customer-storage";

type ValidationIssue = {
  offerId: string;
  productName: string;
  merchantIsOpen: boolean;
  inStock: boolean;
  availableQty: number;
};

export default function CartPage() {
  const {
    items,
    setQuantity,
    removeItem,
    subtotal,
    deliveryFee,
    serviceFee,
    total,
    fulfillment,
    setFulfillment,
    saveCurrentCart,
    savedCarts,
    replaceWith,
    deleteSavedCart,
  } = useCart();
  const [cartName, setCartName] = useState("");
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  async function validateAndUse(cartId: string) {
    const cart = savedCarts.find((item) => item.id === cartId);
    if (!cart) return;
    const res = await fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map((item) => ({ offerId: item.offerId, quantity: item.quantity })),
      }),
    });
    const data = (await res.json()) as { results: ValidationIssue[] };
    const problems = data.results.filter((item) => !item.merchantIsOpen || !item.inStock);
    setIssues(problems);
    if (problems.length) return;
    replaceWith(cart.items, cart.deliveryFee);
    setSavedNotice(`Cargaste “${cart.name}”.`);
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16">
        <Breadcrumbs items={[{ label: "Carrito" }]} />
        <div className="text-center">
          <p className="text-5xl">🛒</p>
          <h1 className="mt-4 font-display text-2xl text-paper">Tu carrito está vacío</h1>
          <p className="mt-2 text-paper/60">Busca lo que necesitas y agrégalo desde la tienda más cercana.</p>
          <Link
            href="/buscar"
            className="mt-6 inline-block rounded-full bg-teal px-6 py-3 font-medium text-paper hover:bg-teal-light"
          >
            Ver productos
          </Link>
        </div>
        {savedCarts.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl text-paper">Carritos guardados</h2>
            <SavedCartList
              savedCarts={savedCarts}
              issues={issues}
              onUse={validateAndUse}
              onDelete={deleteSavedCart}
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Carrito" }]} />
      <h1 className="font-display text-2xl text-paper">Tu carrito</h1>
      <p className="mt-1 text-sm text-paper/60">
        Comprando en <span className="text-paper/90">{items[0]?.merchantName}</span>
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setFulfillment("DELIVERY")}
          className={
            fulfillment === "DELIVERY"
              ? "rounded-lg border border-teal bg-teal/15 px-3 py-2 text-sm text-paper"
              : "rounded-lg border border-ink-border px-3 py-2 text-sm text-paper/70"
          }
        >
          Delivery
        </button>
        <button
          type="button"
          onClick={() => setFulfillment("PICKUP")}
          className={
            fulfillment === "PICKUP"
              ? "rounded-lg border border-teal bg-teal/15 px-3 py-2 text-sm text-paper"
              : "rounded-lg border border-ink-border px-3 py-2 text-sm text-paper/70"
          }
        >
          Paso a recoger al local
        </button>
      </div>

      <ul className="mt-6 flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={item.offerId}
            className="flex items-center gap-4 rounded-card border border-ink-border bg-ink-soft p-4"
          >
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink text-xl">
              {item.productImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.productImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                "🍾"
              )}
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

      <div className="mt-6 rounded-card border border-ink-border bg-ink-soft p-4">
        <p className="text-sm font-medium text-paper">Guardar este carrito (máx. 24 h)</p>
        <div className="mt-2 flex gap-2">
          <input
            value={cartName}
            onChange={(e) => setCartName(e.target.value)}
            placeholder="Ej. Fiesta viernes"
            className="flex-1 rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          />
          <button
            type="button"
            onClick={() => {
              const record = saveCurrentCart(cartName);
              setSavedNotice(record ? `Guardado. Expira en 24 horas.` : "No se pudo guardar.");
              setCartName("");
            }}
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper ring-1 ring-ink-border"
          >
            Guardar
          </button>
        </div>
        {savedNotice && <p className="mt-2 text-xs text-teal-light">{savedNotice}</p>}
      </div>

      {savedCarts.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-xl text-paper">Otros carritos guardados</h2>
          <SavedCartList
            savedCarts={savedCarts}
            issues={issues}
            onUse={validateAndUse}
            onDelete={deleteSavedCart}
          />
        </div>
      )}

      <div className="mt-8 rounded-card border border-ink-border bg-ink-soft p-5">
        <div className="flex justify-between text-sm text-paper/70">
          <span>Subtotal</span>
          <span>{formatDOP(subtotal)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-paper/70">
          <span>{fulfillment === "PICKUP" ? "Recoger en tienda" : "Delivery"}</span>
          <span>{fulfillment === "PICKUP" ? "Gratis" : formatDOP(deliveryFee)}</span>
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

function SavedCartList({
  savedCarts,
  issues,
  onUse,
  onDelete,
}: {
  savedCarts: ReturnType<typeof useCart>["savedCarts"];
  issues: ValidationIssue[];
  onUse: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="mt-3 space-y-3">
      {savedCarts.map((cart) => (
        <li key={cart.id} className="rounded-card border border-ink-border bg-ink-soft p-4">
          <p className="font-medium text-paper">{cart.name}</p>
          <p className="text-sm text-paper/60">
            {cart.merchantName} · {hoursLeft(cart.expiresAt).toFixed(0)} h restantes
          </p>
          {issues.length > 0 && (
            <ul className="mt-2 text-xs text-coral">
              {issues.map((issue) => (
                <li key={issue.offerId}>
                  {!issue.merchantIsOpen
                    ? `${issue.productName}: la tienda está cerrada`
                    : `${issue.productName}: sin stock suficiente (${issue.availableQty})`}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={() => onUse(cart.id)} className="text-sm text-teal-light hover:underline">
              Usar
            </button>
            <button type="button" onClick={() => onDelete(cart.id)} className="text-sm text-paper/40 hover:text-coral">
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
