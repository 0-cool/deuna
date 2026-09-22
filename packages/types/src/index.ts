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

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  ageRestricted: boolean;
  requiresAgeVerification: boolean;
  lowestPrice: number;
  offerCount: number;
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
