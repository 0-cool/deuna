"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartLineItem, FulfillmentType, SavedCartRecord } from "@deuna/types";
import {
  getActiveSavedCarts,
  removeSavedCart,
  saveCartRecord,
} from "./customer-storage";

const STORAGE_KEY = "deuna_cart_v1";
const DELIVERY_FEE_FALLBACK = 150;
const SERVICE_FEE_PERCENT = 2.5;

interface CartContextValue {
  items: CartLineItem[];
  merchantId: string | null;
  deliveryFee: number;
  fulfillment: FulfillmentType;
  setFulfillment: (value: FulfillmentType) => void;
  addItem: (
    item: CartLineItem,
    deliveryFee: number,
    options?: { replace?: boolean },
  ) => "added" | "blocked_other_merchant";
  removeItem: (offerId: string) => void;
  setQuantity: (offerId: string, quantity: number) => void;
  clear: () => void;
  replaceWith: (items: CartLineItem[], deliveryFee: number) => void;
  saveCurrentCart: (name: string) => SavedCartRecord | null;
  savedCarts: SavedCartRecord[];
  refreshSavedCarts: () => void;
  deleteSavedCart: (id: string) => void;
  subtotal: number;
  serviceFee: number;
  total: number;
  requiresAgeVerification: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(DELIVERY_FEE_FALLBACK);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("DELIVERY");
  const [savedCarts, setSavedCarts] = useState<SavedCartRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          items: CartLineItem[];
          deliveryFee: number;
          fulfillment?: FulfillmentType;
        };
        setItems(parsed.items ?? []);
        setDeliveryFee(parsed.deliveryFee ?? DELIVERY_FEE_FALLBACK);
        setFulfillment(parsed.fulfillment ?? "DELIVERY");
      } catch {
        // localStorage corrupto o de una versión anterior: se ignora y se empieza limpio.
      }
    }
    setSavedCarts(getActiveSavedCarts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, deliveryFee, fulfillment }),
    );
  }, [items, deliveryFee, fulfillment, hydrated]);

  const merchantId = items[0]?.merchantId ?? null;

  function addItem(
    item: CartLineItem,
    fee: number,
    options?: { replace?: boolean },
  ): "added" | "blocked_other_merchant" {
    if (merchantId && merchantId !== item.merchantId && !options?.replace) {
      return "blocked_other_merchant";
    }
    setDeliveryFee(fee);
    setItems((prev) => {
      const base = options?.replace ? [] : prev;
      const existing = base.find((i) => i.offerId === item.offerId);
      if (existing) {
        return base.map((i) =>
          i.offerId === item.offerId ? { ...i, quantity: i.quantity + item.quantity } : i,
        );
      }
      return [...base, item];
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

  function replaceWith(nextItems: CartLineItem[], fee: number) {
    setItems(nextItems);
    setDeliveryFee(fee);
  }

  function refreshSavedCarts() {
    setSavedCarts(getActiveSavedCarts());
  }

  function saveCurrentCart(name: string): SavedCartRecord | null {
    if (!items.length || !merchantId) return null;
    const record = saveCartRecord({
      name,
      merchantId,
      merchantName: items[0]?.merchantName ?? "",
      items,
      deliveryFee,
    });
    refreshSavedCarts();
    return record;
  }

  function deleteSavedCart(id: string) {
    removeSavedCart(id);
    refreshSavedCarts();
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items],
  );
  const serviceFee = items.length ? Math.round(subtotal * (SERVICE_FEE_PERCENT / 100)) : 0;
  const effectiveDeliveryFee = fulfillment === "PICKUP" ? 0 : deliveryFee;
  const total = items.length ? subtotal + effectiveDeliveryFee + serviceFee : 0;
  const requiresAgeVerification = items.some((i) => i.ageRestricted);

  const value: CartContextValue = {
    items,
    merchantId,
    deliveryFee: effectiveDeliveryFee,
    fulfillment,
    setFulfillment,
    addItem,
    removeItem,
    setQuantity,
    clear,
    replaceWith,
    saveCurrentCart,
    savedCarts,
    refreshSavedCarts,
    deleteSavedCart,
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
