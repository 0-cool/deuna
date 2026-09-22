import "server-only";
import { prisma } from "@deuna/database";
import { haversineDistanceKm, fuzzyMatches } from "@deuna/utils";
import { CATEGORY_RULES } from "@deuna/config";
import type {
  NearbyMerchant,
  ProductDetail,
  ProductOfferSummary,
  ProductSummary,
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

function toProductSummary(product: {
  id: string;
  slug: string;
  name: string;
  brand: string;
  images: string[];
  ageRestricted: boolean;
  requiresAgeVerification: boolean;
  category: { name: string };
  offers: { price: unknown }[];
}): ProductSummary {
  const prices = product.offers.map((o) => Number(o.price));
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category.name,
    imageUrl: product.images[0] ?? null,
    ageRestricted: product.ageRestricted,
    requiresAgeVerification: product.requiresAgeVerification,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
    offerCount: prices.length,
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
      offers: { where: { isAvailable: true }, select: { price: true } },
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
      offers: { where: { isAvailable: true }, select: { price: true } },
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
      imageUrl: o.product.images[0] ?? null,
      ageRestricted: o.product.ageRestricted,
      requiresAgeVerification: o.product.requiresAgeVerification,
      lowestPrice: Number(o.price),
      offerCount: 1,
    }));

  return {
    id: merchant.id,
    slug: merchant.slug,
    name: merchant.name,
    rating: merchant.rating,
    isOpen: location?.isOpen ?? true,
    distanceKm,
    etaMinutes,
    deliveryFee,
    products,
  };
}
