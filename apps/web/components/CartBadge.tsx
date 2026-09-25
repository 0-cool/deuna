"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link
      href="/carrito"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-ink-border bg-ink-soft text-paper transition hover:border-teal"
      aria-label="Carrito"
    >
      <span aria-hidden>🛒</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-[11px] font-bold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
