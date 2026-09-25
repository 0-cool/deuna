"use client";

export type MerchantPayout = {
  id: string;
  amount: number;
  status: "completed" | "pending";
  at: string;
};

export type MerchantBankAccount = {
  bank: string;
  type: string;
  last4: string;
  verified: boolean;
};

const payoutsKey = (merchantId: string) => `deuna_merchant_payouts_v1:${merchantId}`;
const bankKey = (merchantId: string) => `deuna_merchant_bank_v1:${merchantId}`;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readPayouts(merchantId: string): MerchantPayout[] {
  return readJson(payoutsKey(merchantId), []);
}

export function writePayouts(merchantId: string, items: MerchantPayout[]) {
  window.localStorage.setItem(payoutsKey(merchantId), JSON.stringify(items));
}

export function readBankAccount(merchantId: string): MerchantBankAccount {
  return readJson(bankKey(merchantId), {
    bank: "Banco Popular",
    type: "Cuenta de ahorros",
    last4: "4582",
    verified: true,
  });
}

export function writeBankAccount(merchantId: string, account: MerchantBankAccount) {
  window.localStorage.setItem(bankKey(merchantId), JSON.stringify(account));
}
