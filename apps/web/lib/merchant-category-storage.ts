"use client";

export type MerchantCategoryPref = {
  slug: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  added?: boolean;
};

const keyFor = (merchantId: string) => `deuna_merchant_categories_v1:${merchantId}`;

export function readMerchantCategoryPrefs(merchantId: string): Record<string, MerchantCategoryPref> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(keyFor(merchantId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MerchantCategoryPref>;
  } catch {
    return {};
  }
}

export function writeMerchantCategoryPrefs(
  merchantId: string,
  prefs: Record<string, MerchantCategoryPref>,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(merchantId), JSON.stringify(prefs));
}
