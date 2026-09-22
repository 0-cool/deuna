"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartBadge() {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link
      href="/carrito"
      className="relative flex items-center gap-2 rounded-full border border-ink-border bg-ink-soft px-4 py-2 text-sm font-medium text-paper transition hover:border-teal"
    >
      <span aria-hidden>🛒</span>
      <span className="hidden sm:inline">Carrito</span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 text-xs font-bold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
