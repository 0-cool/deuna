"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLineItem } from "@deuna/types";

// Carrito del MVP: vive en localStorage (sin persistencia en servidor todavía porque no hay
// sesión de usuario real). El modelo Cart/CartItem de Prisma ya está listo para cuando se
// conecte a un customer autenticado — ver packages/database/prisma/schema.prisma.
//
// Regla del MVP (sección 30 del spec): un carrito pertenece a un solo merchant. Agregar un
// producto de otro merchant pide confirmar que se vacíe el carrito actual primero.

const STORAGE_KEY = "deuna_cart_v1";
const DELIVERY_FEE_FALLBACK = 150;
const SERVICE_FEE_PERCENT = 2.5;

interface CartContextValue {
  items: CartLineItem[];
  merchantId: string | null;
  deliveryFee: number;
  addItem: (item: CartLineItem, deliveryFee: number) => "added" | "blocked_other_merchant";
  removeItem: (offerId: string) => void;
  setQuantity: (offerId: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  serviceFee: number;
  total: number;
  requiresAgeVerification: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(DELIVERY_FEE_FALLBACK);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { items: CartLineItem[]; deliveryFee: number };
        setItems(parsed.items ?? []);
        setDeliveryFee(parsed.deliveryFee ?? DELIVERY_FEE_FALLBACK);
      } catch {
        // localStorage corrupto o de una versión anterior: se ignora y se empieza limpio.
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, deliveryFee }));
  }, [items, deliveryFee, hydrated]);

  const merchantId = items[0]?.merchantId ?? null;

  function addItem(item: CartLineItem, fee: number): "added" | "blocked_other_merchant" {
    if (merchantId && merchantId !== item.merchantId) {
      return "blocked_other_merchant";
    }
    setDeliveryFee(fee);
    setItems((prev) => {
      const existing = prev.find((i) => i.offerId === item.offerId);
      if (existing) {
        return prev.map((i) =>
          i.offerId === item.offerId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
    return "added";
  }

  function removeItem(offerId: string) {
    setItems((prev) => prev.filter((i) => i.offerId !== offerId));
  }

  function setQuantity(offerId: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(offerId);
      return;
    }
    setItems((prev) => prev.map((i) => (i.offerId === offerId ? { ...i, quantity } : i)));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );
  const serviceFee = items.length ? Math.round(subtotal * (SERVICE_FEE_PERCENT / 100)) : 0;
  const total = items.length ? subtotal + deliveryFee + serviceFee : 0;
  const requiresAgeVerification = items.some((i) => i.ageRestricted);

  const value: CartContextValue = {
    items,
    merchantId,
    deliveryFee,
    addItem,
    removeItem,
    setQuantity,
    clear,
    subtotal,
    serviceFee,
    total,
    requiresAgeVerification,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
