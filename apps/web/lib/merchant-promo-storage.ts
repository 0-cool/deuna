"use client";

export type MerchantPromoType = "bogo" | "percent" | "fixed" | "special" | "combo" | "happy_hour";

export type MerchantPromo = {
  id: string;
  title: string;
  description: string;
  type: MerchantPromoType;
  imageUrl: string;
  productCount: number;
  startDate: string;
  endDate: string;
  hours?: string;
  isActive: boolean;
  sales: number;
  orders: number;
  views: number;
};

const keyFor = (merchantId: string) => `deuna_merchant_promos_v1:${merchantId}`;

export function readMerchantPromos(merchantId: string): MerchantPromo[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(merchantId));
    if (!raw) return null;
    return JSON.parse(raw) as MerchantPromo[];
  } catch {
    return null;
  }
}

export function writeMerchantPromos(merchantId: string, promos: MerchantPromo[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(merchantId), JSON.stringify(promos));
}
