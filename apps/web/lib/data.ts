import "server-only";
import { prisma } from "@deuna/database";
import { haversineDistanceKm, fuzzyMatches } from "@deuna/utils";
import { CATEGORY_RULES } from "@deuna/config";
import type {
  NearbyMerchant,
  PaymentMethod,
  ProductDetail,
  ProductOfferSummary,
  ProductQuickOffer,
  ProductSummary,
  StoredCustomerOrder,
} from "@deuna/types";
import {
  getSelectedZoneCoordinates,
  getZoneName,
  getSelectedZoneId,
} from "./location";

// Velocidad promedio asumida de un driver en ciudad, para estimar ETA a partir de la
// distancia cuando no hay integración de mapas real todavía.
const AVG_SPEED_KMH = 22;

function etaMinutesFor(
  distanceKm: number,
  zoneEstimatedMinutes: number,
): number {
  const travelMinutes = Math.round((distanceKm / AVG_SPEED_KMH) * 60);
  return Math.max(zoneEstimatedMinutes - 10, 10) + travelMinutes;
}

function deliveryFeeFor(
  distanceKm: number,
  baseFee: number,
  pricePerKm: number,
): number {
  return Math.round(Number(baseFee) + distanceKm * Number(pricePerKm));
}

export async function getCategories() {
  return Object.values(CATEGORY_RULES);
}

export async function getNearbyMerchants(limit = 8): Promise<NearbyMerchant[]> {
  const userPoint = await getSelectedZoneCoordinates();

  const merchants = await prisma.merchant.findMany({
    where: { status: "ACTIVE" },
    include: { locations: { include: { deliveryZone: true } } },
  });

  const results: NearbyMerchant[] = merchants
    .map((m) => {
      const location = m.locations[0];
      if (!location) return null;
      const distanceKm = haversineDistanceKm(userPoint, {
        lat: location.latitude,
        lng: location.longitude,
      });
      const zone = location.deliveryZone;
      const deliveryFee = zone
        ? deliveryFeeFor(
            distanceKm,
            Number(zone.baseFee),
            Number(zone.pricePerKm),
          )
        : 150;
      const etaMinutes = zone
        ? etaMinutesFor(distanceKm, zone.estimatedMinutes)
        : 30;

      return {
        id: m.id,
        slug: m.slug,
        name: m.name,
        logoUrl: m.logoUrl,
        rating: m.rating,
        distanceKm,
        etaMinutes,
        deliveryFee,
        isOpen: location.isOpen,
      } satisfies NearbyMerchant;
    })
    .filter((x): x is NearbyMerchant => x !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return results;
}

function asImages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  return [];
}

function toQuickOffer(
  offer:
    | {
        id: string;
        price: unknown;
        merchant: {
          id: string;
          name: string;
          locations: { isOpen: boolean }[];
        };
        inventory?: { quantity: number } | null;
        deliveryFee?: number;
      }
    | undefined,
  deliveryFee = 150,
): ProductQuickOffer | null {
  if (!offer) return null;
  return {
    offerId: offer.id,
    merchantId: offer.merchant.id,
    merchantName: offer.merchant.name,
    unitPrice: Number(offer.price),
    deliveryFee: offer.deliveryFee ?? deliveryFee,
    inStock: (offer.inventory?.quantity ?? 1) > 0,
    merchantIsOpen: offer.merchant.locations[0]?.isOpen ?? true,
  };
}

function toProductSummary(product: {
  id: string;
  slug: string;
  name: string;
  brand: string;
  images: unknown;
  ageRestricted: boolean;
  requiresAgeVerification: boolean;
  category: { name: string; slug: string };
  offers: {
    id: string;
    price: unknown;
    merchant: { id: string; name: string; locations: { isOpen: boolean }[] };
    inventory?: { quantity: number } | null;
  }[];
}): ProductSummary {
  const prices = product.offers.map((o) => Number(o.price));
  const cheapest = [...product.offers].sort((a, b) => Number(a.price) - Number(b.price))[0];
  const images = asImages(product.images);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category.name,
    categorySlug: product.category.slug,
    imageUrl: images[0] ?? null,
    images,
    ageRestricted: product.ageRestricted,
    requiresAgeVerification: product.requiresAgeVerification,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
    offerCount: prices.length,
    quickOffer: toQuickOffer(cheapest),
  };
}

export async function searchProducts(
  query: string,
  categorySlug?: string,
): Promise<ProductSummary[]> {
  const products = await prisma.product.findMany({
    where: categorySlug ? { category: { slug: categorySlug } } : undefined,
    include: {
      category: true,
      offers: {
        where: { isAvailable: true },
        include: {
          merchant: { include: { locations: true } },
          inventory: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const withOffers = products.filter((p) => p.offers.length > 0);

  if (!query.trim()) {
    return withOffers.map(toProductSummary);
  }

  return withOffers
    .filter((p) => fuzzyMatches(query, p.name) || fuzzyMatches(query, p.brand))
    .map(toProductSummary);
}

export async function getPopularProducts(limit = 8): Promise<ProductSummary[]> {
  const products = await prisma.product.findMany({
    take: limit,
    include: {
      category: true,
      offers: {
        where: { isAvailable: true },
        include: {
          merchant: { include: { locations: true } },
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return products.filter((p) => p.offers.length > 0).map(toProductSummary);
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const userPoint = await getSelectedZoneCoordinates();

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      offers: {
        where: { isAvailable: true },
        include: {
          merchant: {
            include: { locations: { include: { deliveryZone: true } } },
          },
          inventory: true,
        },
      },
    },
  });

  if (!product) return null;

  const offers: ProductOfferSummary[] = product.offers.map((offer) => {
    const location = offer.merchant.locations[0];
    const distanceKm = location
      ? haversineDistanceKm(userPoint, {
          lat: location.latitude,
          lng: location.longitude,
        })
      : 0;
    const zone = location?.deliveryZone;
    const deliveryFee = zone
      ? deliveryFeeFor(
          distanceKm,
          Number(zone.baseFee),
          Number(zone.pricePerKm),
        )
      : 150;
    const etaMinutes = zone
      ? etaMinutesFor(distanceKm, zone.estimatedMinutes)
      : 30;

    return {
      offerId: offer.id,
      merchantId: offer.merchant.id,
      merchantName: offer.merchant.name,
      merchantSlug: offer.merchant.slug,
      merchantLogoUrl: offer.merchant.logoUrl,
      price: Number(offer.price),
      compareAtPrice: offer.compareAtPrice
        ? Number(offer.compareAtPrice)
        : null,
      currency: "DOP",
      inStock: (offer.inventory?.quantity ?? 0) > 0,
      distanceKm,
      etaMinutes,
      deliveryFee,
      merchantRating: offer.merchant.rating,
    };
  });

  offers.sort((a, b) => a.price - b.price);

  return {
    ...toProductSummary(product),
    description: product.description,
    offers,
  };
}

export async function getCurrentZoneLabel(): Promise<string> {
  return getZoneName(await getSelectedZoneId());
}

export async function getAllNearbyMerchants(): Promise<NearbyMerchant[]> {
  return getNearbyMerchants(100);
}

export async function getMerchantBySlug(slug: string) {
  const userPoint = await getSelectedZoneCoordinates();

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    include: {
      locations: { include: { deliveryZone: true } },
      offers: {
        where: { isAvailable: true },
        include: { product: { include: { category: true } }, inventory: true },
      },
    },
  });

  if (!merchant) return null;

  const location = merchant.locations[0];
  const distanceKm = location
    ? haversineDistanceKm(userPoint, {
        lat: location.latitude,
        lng: location.longitude,
      })
    : 0;
  const zone = location?.deliveryZone;
  const deliveryFee = zone
    ? deliveryFeeFor(distanceKm, Number(zone.baseFee), Number(zone.pricePerKm))
    : 150;
  const etaMinutes = zone
    ? etaMinutesFor(distanceKm, zone.estimatedMinutes)
    : 30;

  const products: ProductSummary[] = merchant.offers
    .filter((o) => (o.inventory?.quantity ?? 0) > 0)
    .map((o) => ({
      id: o.product.id,
      slug: o.product.slug,
      name: o.product.name,
      brand: o.product.brand,
      category: o.product.category.name,
      categorySlug: o.product.category.slug,
      imageUrl: asImages(o.product.images)[0] ?? null,
      images: asImages(o.product.images),
      ageRestricted: o.product.ageRestricted,
      requiresAgeVerification: o.product.requiresAgeVerification,
      lowestPrice: Number(o.price),
      offerCount: 1,
      quickOffer: {
        offerId: o.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        unitPrice: Number(o.price),
        deliveryFee,
        inStock: (o.inventory?.quantity ?? 0) > 0,
        merchantIsOpen: location?.isOpen ?? true,
      },
    }));

  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    logoUrl: merchant.logoUrl,
    rating: merchant.rating,
    isOpen: location?.isOpen ?? true,
    address: location?.address ?? null,
    distanceKm,
    etaMinutes,
    deliveryFee,
    products,
  };
}

export async function getRelatedProducts(
  slug: string,
  limit = 4,
): Promise<ProductSummary[]> {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });
  if (!product) return [];

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, NOT: { id: product.id } },
    take: limit,
    include: {
      category: true,
      offers: {
        where: { isAvailable: true },
        include: {
          merchant: { include: { locations: true } },
          inventory: true,
        },
      },
    },
  });

  return related.filter((item) => item.offers.length > 0).map(toProductSummary);
}

export async function validateCartOffers(
  items: { offerId: string; quantity: number }[],
): Promise<
  {
    offerId: string;
    productName: string;
    merchantId: string;
    merchantName: string;
    merchantIsOpen: boolean;
    inStock: boolean;
    availableQty: number;
    unitPrice: number;
  }[]
> {
  const offers = await prisma.productOffer.findMany({
    where: { id: { in: items.map((item) => item.offerId) } },
    include: {
      product: true,
      merchant: { include: { locations: true } },
      inventory: true,
    },
  });

  return items.map((item) => {
    const offer = offers.find((entry) => entry.id === item.offerId);
    return {
      offerId: item.offerId,
      productName: offer?.product.name ?? "Producto",
      merchantId: offer?.merchant.id ?? "",
      merchantName: offer?.merchant.name ?? "",
      merchantIsOpen: offer?.merchant.locations[0]?.isOpen ?? false,
      inStock: (offer?.inventory?.quantity ?? 0) >= item.quantity && Boolean(offer?.isAvailable),
      availableQty: offer?.inventory?.quantity ?? 0,
      unitPrice: offer ? Number(offer.price) : 0,
    };
  });
}

export async function getCustomerOrders(customerProfileId: string): Promise<StoredCustomerOrder[]> {
  const orders = await prisma.order.findMany({
    where: { customerProfileId },
    include: {
      merchant: true,
      address: true,
      payment: true,
      items: {
        include: {
          productOffer: { include: { product: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return orders.map((order) => ({
    code: order.code,
    createdAt: order.createdAt.toISOString(),
    fulfillment: "DELIVERY",
    merchantId: order.merchantId,
    merchantName: order.merchant.name,
    merchantAddress: order.address.line1,
    items: order.items.map((item) => ({
      offerId: item.productOfferId,
      productId: item.productOffer.product.id,
      productName: item.productName,
      productImageUrl: asImages(item.productOffer.product.images)[0] ?? null,
      merchantId: order.merchantId,
      merchantName: order.merchant.name,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      ageRestricted: item.productOffer.product.ageRestricted,
    })),
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    serviceFee: Number(order.serviceFee),
    total: Number(order.total),
    paymentMethod: (order.payment?.method ?? "CASH") as PaymentMethod,
    fullName: "",
    phone: "",
    address: order.address.line1,
    reference: order.address.reference ?? "",
    etaMinutes: 25,
    status: order.status,
    cancelledAt: order.status === "CANCELLED" ? order.updatedAt.toISOString() : null,
    rating: null,
    chat: [],
  }));
}
