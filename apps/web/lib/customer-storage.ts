"use client";

import type {
  CartLineItem,
  OrderChatMessage,
  OrderRating,
  OrderStatus,
  FavoriteMerchant,
  FavoriteProduct,
  SavedCartRecord,
  UsedCoupon,
  SavedLocation,
  NotificationPrefs,
  SavedPaymentMethod,
  StoredCustomerOrder,
} from "@deuna/types";

const ORDERS_KEY = "deuna_orders_v1";
const LOCATIONS_KEY = "deuna_locations_v1";
const SAVED_CARTS_KEY = "deuna_saved_carts_v1";
const PAYMENTS_KEY = "deuna_payment_methods_v1";
const FAVORITES_KEY = "deuna_favorites_v1";
const COUPONS_KEY = "deuna_used_coupons_v1";
const LOCATION_PROMPT_KEY = "deuna_location_prompted_v1";
const NOTIF_PREFS_KEY = "deuna_notif_prefs_v1";
const NOTIF_READ_KEY = "deuna_notif_read_v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function hasPromptedLocation(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(LOCATION_PROMPT_KEY) === "1";
}

export function markLocationPrompted() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCATION_PROMPT_KEY, "1");
}

export function getStoredOrders(): StoredCustomerOrder[] {
  return readJson<StoredCustomerOrder[]>(ORDERS_KEY, []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getStoredOrder(code: string): StoredCustomerOrder | null {
  return getStoredOrders().find((order) => order.code === code) ?? null;
}

export function upsertStoredOrder(order: StoredCustomerOrder) {
  const next = getStoredOrders().filter((item) => item.code !== order.code);
  next.unshift(order);
  writeJson(ORDERS_KEY, next);
}

export function updateStoredOrder(
  code: string,
  patch: Partial<StoredCustomerOrder>,
): StoredCustomerOrder | null {
  const current = getStoredOrder(code);
  if (!current) return null;
  const next = { ...current, ...patch };
  upsertStoredOrder(next);
  return next;
}

export function appendOrderChat(code: string, message: OrderChatMessage) {
  const current = getStoredOrder(code);
  if (!current) return;
  upsertStoredOrder({ ...current, chat: [...current.chat, message] });
}

export function setOrderRating(code: string, rating: OrderRating) {
  updateStoredOrder(code, { rating });
}

export function setOrderStatus(code: string, status: OrderStatus) {
  updateStoredOrder(code, {
    status,
    cancelledAt: status === "CANCELLED" ? new Date().toISOString() : null,
  });
}

export function getSavedLocations(): SavedLocation[] {
  return readJson<SavedLocation[]>(LOCATIONS_KEY, []);
}

export function saveLocation(location: SavedLocation) {
  const rest = getSavedLocations().filter((item) => item.id !== location.id);
  const next = location.isDefault
    ? [location, ...rest.map((item) => ({ ...item, isDefault: false }))]
    : [...rest, location];
  writeJson(LOCATIONS_KEY, next);
}

export function removeLocation(id: string) {
  writeJson(
    LOCATIONS_KEY,
    getSavedLocations().filter((item) => item.id !== id),
  );
}

export function getActiveSavedCarts(): SavedCartRecord[] {
  const now = Date.now();
  const fresh = readJson<SavedCartRecord[]>(SAVED_CARTS_KEY, []).filter(
    (cart) => new Date(cart.expiresAt).getTime() > now,
  );
  writeJson(SAVED_CARTS_KEY, fresh);
  return fresh.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function saveCartRecord(input: {
  name: string;
  merchantId: string;
  merchantName: string;
  items: CartLineItem[];
  deliveryFee: number;
}): SavedCartRecord {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
  const record: SavedCartRecord = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cart-${createdAt.getTime()}`,
    name: input.name.trim() || `Carrito ${createdAt.toLocaleTimeString("es-DO")}`,
    merchantId: input.merchantId,
    merchantName: input.merchantName,
    items: input.items,
    deliveryFee: input.deliveryFee,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  writeJson(SAVED_CARTS_KEY, [record, ...getActiveSavedCarts()]);
  return record;
}

export function removeSavedCart(id: string) {
  writeJson(
    SAVED_CARTS_KEY,
    getActiveSavedCarts().filter((cart) => cart.id !== id),
  );
}

function sanitizePayment(method: SavedPaymentMethod): SavedPaymentMethod {
  return {
    ...method,
    last4: method.last4 ? method.last4.replace(/\D/g, "").slice(-4) : null,
    holderName: method.holderName.trim().slice(0, 80),
    expiry: method.expiry && /^\d{2}\/\d{2}$/.test(method.expiry) ? method.expiry : method.expiry,
  };
}

export function getSavedPaymentMethods(): SavedPaymentMethod[] {
  return readJson<SavedPaymentMethod[]>(PAYMENTS_KEY, []).map(sanitizePayment);
}

export function savePaymentMethod(method: SavedPaymentMethod) {
  const safe = sanitizePayment(method);
  const rest = getSavedPaymentMethods().filter((item) => item.id !== safe.id);
  const next = safe.isDefault
    ? [safe, ...rest.map((item) => ({ ...item, isDefault: false }))]
    : [...rest, safe];
  writeJson(PAYMENTS_KEY, next);
}

export function removePaymentMethod(id: string) {
  writeJson(
    PAYMENTS_KEY,
    getSavedPaymentMethods().filter((item) => item.id !== id),
  );
}

export function getFavorites(): { merchants: FavoriteMerchant[]; products: FavoriteProduct[] } {
  return readJson(FAVORITES_KEY, { merchants: [], products: [] });
}

export function toggleFavoriteMerchant(merchant: FavoriteMerchant) {
  const current = getFavorites();
  const exists = current.merchants.some((item) => item.id === merchant.id);
  writeJson(FAVORITES_KEY, {
    ...current,
    merchants: exists
      ? current.merchants.filter((item) => item.id !== merchant.id)
      : [merchant, ...current.merchants],
  });
}

export function toggleFavoriteProduct(product: FavoriteProduct) {
  const current = getFavorites();
  const exists = current.products.some((item) => item.id === product.id);
  writeJson(FAVORITES_KEY, {
    ...current,
    products: exists
      ? current.products.filter((item) => item.id !== product.id)
      : [product, ...current.products],
  });
}

export function getUsedCoupons(): UsedCoupon[] {
  return readJson<UsedCoupon[]>(COUPONS_KEY, []).sort(
    (a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime(),
  );
}

export function markCouponUsed(coupon: UsedCoupon) {
  const rest = getUsedCoupons().filter((item) => item.id !== coupon.id);
  writeJson(COUPONS_KEY, [coupon, ...rest]);
}

export const DEFAULT_NOTIF_PREFS: NotificationPrefs = {
  email: true,
  sms: true,
  push: true,
  orders: true,
  promos: true,
  news: true,
  recommendations: true,
  platform: false,
  surveys: false,
};

export function getNotificationPrefs(): NotificationPrefs {
  return { ...DEFAULT_NOTIF_PREFS, ...readJson<Partial<NotificationPrefs>>(NOTIF_PREFS_KEY, {}) };
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  writeJson(NOTIF_PREFS_KEY, prefs);
}

export function getReadNotificationIds(): string[] {
  return readJson<string[]>(NOTIF_READ_KEY, []);
}

export function markNotificationsRead(ids: string[]) {
  writeJson(NOTIF_READ_KEY, Array.from(new Set([...getReadNotificationIds(), ...ids])));
}

export function hoursLeft(expiresAt: string): number {
  return Math.max(0, (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
}
