"use client";

export type ReviewStatus = "published" | "pending" | "reported";

export type ReviewOverride = {
  status?: ReviewStatus;
  reply?: string;
};

const keyFor = (merchantId: string) => `deuna_merchant_reviews_v1:${merchantId}`;

export function readReviewOverrides(merchantId: string): Record<string, ReviewOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(keyFor(merchantId));
    return raw ? (JSON.parse(raw) as Record<string, ReviewOverride>) : {};
  } catch {
    return {};
  }
}

export function writeReviewOverrides(merchantId: string, value: Record<string, ReviewOverride>) {
  window.localStorage.setItem(keyFor(merchantId), JSON.stringify(value));
}
