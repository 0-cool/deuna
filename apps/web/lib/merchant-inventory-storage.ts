"use client";

export type InventoryMovement = {
  id: string;
  offerId: string;
  productName: string;
  kind: "in" | "adjust" | "sale" | "out";
  delta: number;
  at: string;
};

const keyFor = (merchantId: string) => `deuna_merchant_inventory_moves_v1:${merchantId}`;

export function readInventoryMovements(merchantId: string): InventoryMovement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(merchantId));
    if (!raw) return [];
    return JSON.parse(raw) as InventoryMovement[];
  } catch {
    return [];
  }
}

export function writeInventoryMovements(merchantId: string, items: InventoryMovement[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(merchantId), JSON.stringify(items.slice(0, 30)));
}

export function logInventoryMovement(merchantId: string, item: Omit<InventoryMovement, "id" | "at">) {
  const next: InventoryMovement = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  writeInventoryMovements(merchantId, [next, ...readInventoryMovements(merchantId)]);
  return next;
}
