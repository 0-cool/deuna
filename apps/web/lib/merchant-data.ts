import "server-only";
import { prisma } from "@deuna/database";
import { fuzzyMatches } from "@deuna/utils";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Órdenes que todavía requieren alguna acción del merchant (aceptar, preparar, marcar listo).
const PENDING_STATUSES = [
  "ORDER_PLACED",
  "MERCHANT_ACCEPTED",
  "PREPARING",
] as const;

export async function getMerchantDashboardStats(merchantId: string) {
  const todayOrders = await prisma.order.findMany({
    where: {
      merchantId,
      createdAt: { gte: startOfToday() },
      status: { not: "CANCELLED" },
    },
    select: { total: true },
  });

  const pendingCount = await prisma.order.count({
    where: { merchantId, status: { in: [...PENDING_STATUSES] } },
  });

  const ordersCount = todayOrders.length;
  const revenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageOrder = ordersCount > 0 ? revenue / ordersCount : 0;

  return {
    ordersToday: ordersCount,
    revenueToday: revenue,
    averageOrderToday: averageOrder,
    pendingOrders: pendingCount,
  };
}

export async function getMerchantOffers(merchantId: string) {
  const offers = await prisma.productOffer.findMany({
    where: { merchantId },
    include: { product: true, inventory: true },
    orderBy: { product: { name: "asc" } },
  });

  return offers.map((offer) => ({
    id: offer.id,
    productName: offer.product.name,
    brand: offer.product.brand,
    price: Number(offer.price),
    quantity: offer.inventory?.quantity ?? 0,
    isAvailable: offer.isAvailable,
  }));
}

// Detalle completo de una oferta propia para la pantalla de edición. `sharedWithOtherMerchants`
// indica si el Product maestro también lo vende otro merchant — en ese caso el nombre, marca,
// descripción y categoría se editan en modo solo-lectura desde aquí (ver updateProductAction).
export async function getMerchantOfferDetail(merchantId: string, offerId: string) {
  const offer = await prisma.productOffer.findUnique({
    where: { id: offerId },
    include: { product: { include: { category: true } }, inventory: true },
  });
  if (!offer || offer.merchantId !== merchantId) return null;

  const otherOffersCount = await prisma.productOffer.count({
    where: { productId: offer.productId, NOT: { id: offer.id } },
  });

  return {
    id: offer.id,
    productId: offer.productId,
    name: offer.product.name,
    brand: offer.product.brand,
    description: offer.product.description,
    categorySlug: offer.product.category.slug,
    imageUrl: offer.product.images[0] ?? "",
    price: Number(offer.price),
    quantity: offer.inventory?.quantity ?? 0,
    isAvailable: offer.isAvailable,
    sharedWithOtherMerchants: otherOffersCount > 0,
  };
}

// Productos del catálogo maestro que este merchant todavía NO vende, para que pueda agregar su
// propia oferta en vez de crear un Product duplicado (rompería el comparador de precios).
export async function searchMerchantCatalog(merchantId: string, query: string) {
  const products = await prisma.product.findMany({
    where: { offers: { none: { merchantId } } },
    include: { category: true, offers: { select: { id: true } } },
    orderBy: { name: "asc" },
  });

  const filtered = query.trim()
    ? products.filter((p) => fuzzyMatches(query, p.name) || fuzzyMatches(query, p.brand))
    : products;

  return filtered.slice(0, 30).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    categoryLabel: p.category.name,
    offerCount: p.offers.length,
  }));
}

export async function getMerchantOrders(merchantId: string) {
  const orders = await prisma.order.findMany({
    where: { merchantId },
    include: {
      items: true,
      address: true,
      customerProfile: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    customerName: order.customerProfile.fullName,
    address: `${order.address.line1}, ${order.address.city}`,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })),
  }));
}
