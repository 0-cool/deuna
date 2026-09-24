// Tipos y enums compartidos entre apps/web, apps/api y futuras apps móviles.
// No poner lógica de negocio aquí, solo formas de datos.

export type UserRole = "CUSTOMER" | "MERCHANT" | "DRIVER" | "ADMIN";

export type OrderStatus =
  | "ORDER_PLACED"
  | "MERCHANT_ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "DRIVER_ASSIGNED"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  "ORDER_PLACED",
  "MERCHANT_ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
];

export type VehicleType = "MOTORCYCLE" | "CAR" | "BICYCLE" | "ON_FOOT";

export type PaymentMethod = "CARD" | "CASH" | "TRANSFER";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type AgeVerificationMethod = "SELF_DECLARED" | "EXTERNAL_PROVIDER" | "DELIVERY_CONFIRMED";

export interface AgeVerificationResult {
  verified: boolean;
  method: AgeVerificationMethod;
  verifiedAt: string | null;
}

// Un producto puede existir en varios merchants con precios distintos: esta es la forma
// "aplanada" que consume el frontend cuando compara ofertas de un mismo producto.
export interface ProductOfferSummary {
  offerId: string;
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  merchantLogoUrl: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: "DOP";
  inStock: boolean;
  distanceKm: number;
  etaMinutes: number;
  deliveryFee: number;
  merchantRating: number;
}

export type FulfillmentType = "DELIVERY" | "PICKUP";

export interface ProductQuickOffer {
  offerId: string;
  merchantId: string;
  merchantName: string;
  unitPrice: number;
  deliveryFee: number;
  inStock: boolean;
  merchantIsOpen: boolean;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categorySlug: string;
  imageUrl: string | null;
  images: string[];
  ageRestricted: boolean;
  requiresAgeVerification: boolean;
  lowestPrice: number;
  offerCount: number;
  quickOffer: ProductQuickOffer | null;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  offers: ProductOfferSummary[];
}

export type MerchantSortOption = "price" | "distance" | "eta" | "rating";

export interface NearbyMerchant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  deliveryFee: number;
  isOpen: boolean;
}

export interface CartLineItem {
  offerId: string;
  productId: string;
  productName: string;
  productImageUrl: string | null;
  merchantId: string;
  merchantName: string;
  unitPrice: number;
  quantity: number;
  ageRestricted: boolean;
}

export interface SavedLocation {
  id: string;
  label: string;
  line1: string;
  reference: string | null;
  city: string;
  zoneId: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

export type SavedPaymentKind = "CARD" | "DEBIT" | "CASH" | "WALLET";

export type SavedCardBrand = "visa" | "mastercard" | "other";

export interface SavedPaymentMethod {
  id: string;
  kind: SavedPaymentKind;
  brand: SavedCardBrand | null;
  holderName: string;
  last4: string | null;
  expiry: string | null;
  isDefault: boolean;
  updatedAt: string;
}

export interface FavoriteMerchant {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  rating: number;
  etaMinutes: number;
  deliveryFee: number;
}

export interface FavoriteProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  images: string[];
  ageRestricted: boolean;
  lowestPrice: number;
}

export interface UsedCoupon {
  id: string;
  title: string;
  usedAt: string;
  savedAmount: number;
  orderCode: string | null;
}

export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
  orders: boolean;
  promos: boolean;
  news: boolean;
  recommendations: boolean;
  platform: boolean;
  surveys: boolean;
}

export interface SavedCartRecord {
  id: string;
  name: string;
  merchantId: string;
  merchantName: string;
  items: CartLineItem[];
  deliveryFee: number;
  createdAt: string;
  expiresAt: string;
}

export interface OrderChatMessage {
  id: string;
  from: "customer" | "driver";
  text: string;
  at: string;
}

export interface OrderRating {
  orderStars: number;
  driverStars: number;
  comment: string;
  at: string;
}

export interface StoredCustomerOrder {
  code: string;
  createdAt: string;
  fulfillment: FulfillmentType;
  merchantId: string;
  merchantName: string;
  merchantAddress: string | null;
  items: CartLineItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  fullName: string;
  phone: string;
  address: string;
  reference: string;
  etaMinutes: number;
  status: OrderStatus;
  cancelledAt: string | null;
  rating: OrderRating | null;
  chat: OrderChatMessage[];
}

export interface CartSummary {
  merchantId: string | null;
  items: CartLineItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  requiresAgeVerification: boolean;
}

export interface DeliveryZoneConfig {
  id: string;
  name: string;
  baseFee: number;
  pricePerKm: number;
  estimatedMinutes: number;
}

export interface CommissionConfig {
  merchantCommissionPercent: number;
  serviceFeeFixed: number;
  serviceFeePercent: number;
}
