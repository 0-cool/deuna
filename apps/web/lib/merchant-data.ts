import "server-only";
import { prisma } from "@deuna/database";
import { fuzzyMatches } from "@deuna/utils";
import { parseOpenHours } from "./merchant-hours";

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

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function firstImage(images: unknown) {
  return Array.isArray(images) ? String(images[0] ?? "") : "";
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function conversionRate(orders: { status: string }[]) {
  const counted = orders.filter((order) => order.status !== "CANCELLED");
  if (counted.length === 0) return 0;
  const delivered = counted.filter((order) => order.status === "DELIVERED").length;
  return Math.round((delivered / counted.length) * 1000) / 10;
}

export async function getMerchantOffers(merchantId: string) {
  const offers = await prisma.productOffer.findMany({
    where: { merchantId },
    include: { product: { include: { category: true } }, inventory: true },
    orderBy: { product: { name: "asc" } },
  });

  return offers.map((offer) => ({
    id: offer.id,
    sku: offer.sku || displaySku(offer.product.brand, offer.product.name),
    productName: offer.product.name,
    brand: offer.product.brand,
    categoryName: offer.product.category.name,
    categorySlug: offer.product.category.slug,
    imageUrl: firstImage(offer.product.images),
    price: Number(offer.price),
    compareAtPrice: offer.compareAtPrice ? Number(offer.compareAtPrice) : null,
    quantity: offer.inventory?.quantity ?? 0,
    lowStockAlert: offer.inventory?.lowStockAlert ?? 5,
    isAvailable: offer.isAvailable,
    createdAt: offer.createdAt,
    updatedAt: offer.inventory?.updatedAt ?? offer.updatedAt,
  }));
}

function displaySku(brand: string, name: string) {
  return `${brand} ${name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18);
}

export async function getMerchantPanelContext(merchantId: string) {
  const [merchant, pendingOrders] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        user: { select: { email: true } },
        locations: { include: { deliveryZone: true }, take: 1 },
      },
    }),
    prisma.order.count({
      where: { merchantId, status: { in: [...PENDING_STATUSES] } },
    }),
  ]);

  const location = merchant?.locations[0];
  return {
    name: merchant?.name ?? "Tu tienda",
    slug: merchant?.slug ?? "",
    logoUrl: merchant?.logoUrl ?? "",
    address: location?.address ?? "República Dominicana",
    zoneName: location?.deliveryZone?.name ?? location?.address ?? "Tu zona",
    isOpen: location?.isOpen ?? true,
    email: merchant?.user.email ?? "",
    pendingOrders,
    locationId: location?.id ?? "",
  };
}

export async function getMerchantSettings(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: {
      user: { select: { email: true, phone: true } },
      locations: { include: { deliveryZone: true }, take: 1 },
    },
  });
  const location = merchant?.locations[0];

  return {
    name: merchant?.name ?? "Tu tienda",
    slug: merchant?.slug ?? "",
    logoUrl: merchant?.logoUrl ?? "",
    status: merchant?.status ?? "PENDING_APPROVAL",
    email: merchant?.user.email ?? "",
    phone: merchant?.user.phone ?? "",
    createdAt: merchant?.createdAt.toISOString().slice(0, 10) ?? "",
    locationId: location?.id ?? "",
    address: location?.address ?? "",
    latitude: location?.latitude ?? 18.4726,
    longitude: location?.longitude ?? -69.8901,
    zoneId: location?.deliveryZoneId ?? "dn",
    zoneName: location?.deliveryZone?.name ?? "Distrito Nacional",
    isOpen: location?.isOpen ?? true,
  };
}

export async function getMerchantHours(merchantId: string) {
  const location = await prisma.merchantLocation.findFirst({
    where: { merchantId },
  });

  return {
    locationId: location?.id ?? "",
    isOpen: location?.isOpen ?? true,
    hours: parseOpenHours(location?.openHours),
  };
}

export async function getMerchantDashboard(merchantId: string) {
  const today = startOfDay();
  const yesterday = addDays(today, -1);
  const weekStart = addDays(today, -6);
  const prevWeekStart = addDays(today, -13);

  const [context, weekOrders, prevWeekOrders, offers, recentOrders, promotions] = await Promise.all([
    getMerchantPanelContext(merchantId),
    prisma.order.findMany({
      where: { merchantId, createdAt: { gte: weekStart }, status: { not: "CANCELLED" } },
      select: { total: true, status: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: {
        merchantId,
        createdAt: { gte: prevWeekStart, lt: weekStart },
        status: { not: "CANCELLED" },
      },
      select: { total: true, status: true },
    }),
    getMerchantOffers(merchantId),
    prisma.order.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, code: true, status: true, total: true, createdAt: true },
    }),
    prisma.promotion.findMany({
      where: { merchantId, isActive: true, endDate: { gte: new Date() } },
      orderBy: { endDate: "asc" },
      take: 3,
    }),
  ]);

  const todayOrders = weekOrders.filter((order) => order.createdAt >= today);
  const yesterdayOrders = weekOrders.filter(
    (order) => order.createdAt >= yesterday && order.createdAt < today,
  );
  const revenueToday = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const revenueYesterday = yesterdayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const weeklyRevenue = weekOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const prevWeeklyRevenue = prevWeekOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const published = offers.filter((offer) => offer.isAvailable);
  const newThisWeek = offers.filter((offer) => offer.createdAt >= weekStart).length;
  const conversion = conversionRate(weekOrders);
  const prevConversion = conversionRate(prevWeekOrders);

  const salesByDay = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const next = addDays(date, 1);
    const total = weekOrders
      .filter((order) => order.createdAt >= date && order.createdAt < next)
      .reduce((sum, order) => sum + Number(order.total), 0);
    return {
      label: date.toLocaleDateString("es-DO", { weekday: "short" }).replace(".", ""),
      value: total,
    };
  });

  const hourSlots = [6, 8, 10, 12, 14, 16, 18, 20, 22];
  const uniqueHours = new Set(todayOrders.map((order) => order.createdAt.getHours()));
  const clustered = todayOrders.length > 1 && uniqueHours.size <= 1;
  const ordersByHour = hourSlots.map((hour) => ({
    label:
      hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
    value: 0,
  }));
  todayOrders.forEach((order, index) => {
    const hour = clustered ? hourSlots[index % hourSlots.length] : order.createdAt.getHours();
    const slot = hourSlots.reduce((best, current) =>
      Math.abs(current - hour) < Math.abs(best - hour) ? current : best,
    );
    const point = ordersByHour[hourSlots.indexOf(slot)];
    if (point) point.value += 1;
  });

  return {
    store: context,
    kpis: {
      revenueToday,
      revenueTodayDelta: pctChange(revenueToday, revenueYesterday),
      ordersToday: todayOrders.length,
      pendingOrders: context.pendingOrders,
      preparingOrders: todayOrders.filter((order) =>
        ["ORDER_PLACED", "MERCHANT_ACCEPTED", "PREPARING"].includes(order.status),
      ).length,
      publishedProducts: published.length,
      newProductsThisWeek: newThisWeek,
      conversion,
      conversionDelta: Math.round((conversion - prevConversion) * 10) / 10,
      weeklyRevenue,
      weeklyDelta: pctChange(weeklyRevenue, prevWeeklyRevenue),
    },
    salesByDay,
    ordersByHour,
    products: offers.slice(0, 6),
    lowStock: offers.filter((offer) => offer.quantity <= offer.lowStockAlert).slice(0, 4),
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
    })),
    promotions: promotions.map((promo) => ({
      id: promo.id,
      type: promo.type,
      endDate: promo.endDate,
    })),
    todayLabel: today.toLocaleDateString("es-DO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  };
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
    imageUrl: Array.isArray(offer.product.images)
      ? String(offer.product.images[0] ?? "")
      : "",
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

function displayPaymentMethod(orderId: string, method?: string | null) {
  if (method === "CASH") return "Efectivo";
  if (method === "TRANSFER") return "DeUna Pay";
  if (method === "CARD") return orderId.charCodeAt(0) % 2 === 0 ? "Tarjeta de crédito" : "Tarjeta de débito";
  const options = ["Tarjeta de crédito", "Tarjeta de débito", "Efectivo", "DeUna Pay"] as const;
  return options[orderId.charCodeAt(orderId.length - 1) % options.length];
}

export async function getMerchantFinance(merchantId: string) {
  const [merchant, orders] = await Promise.all([
    prisma.merchant.findUnique({ where: { id: merchantId }, select: { commissionPct: true } }),
    prisma.order.findMany({
      where: { merchantId },
      include: { payment: true, customerProfile: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const commissionPct = merchant?.commissionPct ?? 15;

  return {
    commissionPct,
    transactions: orders.map((order) => {
      const sale = Number(order.total);
      const commission = Math.round(sale * (commissionPct / 100));
      const cancelled = order.status === "CANCELLED";
      const completed =
        !cancelled &&
        (order.payment?.status === "PAID" ||
          order.status === "DELIVERED" ||
          order.status === "ON_THE_WAY" ||
          order.status === "PICKED_UP");
      return {
        id: order.id,
        code: order.code,
        createdAt: order.createdAt,
        customerName: order.customerProfile.fullName,
        method: displayPaymentMethod(order.id, order.payment?.method),
        sale,
        commission: cancelled ? 0 : commission,
        net: cancelled ? 0 : sale - commission,
        status: cancelled ? "cancelled" : completed ? "completed" : "pending",
      };
    }),
  };
}

export async function getMerchantAnalytics(merchantId: string) {
  const orders = await prisma.order.findMany({
    where: { merchantId },
    include: {
      items: {
        include: {
          productOffer: { include: { product: { include: { category: true } } } },
        },
      },
      address: true,
      payment: true,
      customerProfile: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt,
    total: Number(order.total),
    status: order.status,
    customerId: order.customerProfileId,
    method: displayPaymentMethod(order.id, order.payment?.method),
    zone: order.address.reference || order.address.city || order.address.line1,
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      sales: Number(item.unitPrice) * item.quantity,
      category: item.productOffer.product.category.name,
      imageUrl: firstImage(item.productOffer.product.images),
    })),
  }));
}

const DEMO_REVIEWERS = [
  { name: "Juan Pérez", comment: "Excelente servicio y entrega rápida." },
  { name: "María Gómez", comment: "Muy buenos precios y todo super frío." },
  { name: "Carlos Rodríguez", comment: "Llegó un poco dañado, pero el equipo respondió rápido." },
  { name: "Ana López", comment: "Producto original y excelente empaque." },
  { name: "Luis Ramírez", comment: "El hielo llegó perfecto, justo a tiempo." },
  { name: "Sofía Castillo", comment: "Buen producto, aunque tardó un poco más de lo estimado." },
  { name: "Raúl Díaz", comment: "Todo bien, original y a buen precio." },
  { name: "Elena Cruz", comment: "Muy buena atención y entrega rápida." },
];

export async function getMerchantReviews(merchantId: string) {
  const reviews = await prisma.review.findMany({
    where: { merchantId },
    include: {
      author: { include: { customerProfile: true } },
      order: {
        include: {
          items: {
            include: { productOffer: { include: { product: true } } },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  if (reviews.length > 0) {
    return reviews.map((review) => {
      const item = review.order.items[0];
      return {
        id: review.id,
        customerName: review.author.customerProfile?.fullName ?? "Cliente DeUna",
        productName: item?.productName ?? "Pedido DeUna",
        imageUrl: firstImage(item?.productOffer.product.images),
        rating: review.rating,
        comment: review.comment ?? "",
        createdAt: review.createdAt,
        status: review.isModerated ? "published" : "pending",
      };
    });
  }

  const offers = await getMerchantOffers(merchantId);
  const now = Date.now();
  return DEMO_REVIEWERS.map((reviewer, index) => {
    const offer = offers[index % Math.max(offers.length, 1)];
    const ratings = [5, 5, 3, 5, 5, 4, 5, 5];
    return {
      id: `demo-${merchantId}-${index}`,
      customerName: reviewer.name,
      productName: offer?.productName ?? "Producto DeUna",
      imageUrl: offer?.imageUrl ?? "",
      rating: ratings[index] ?? 5,
      comment: reviewer.comment,
      createdAt: new Date(now - index * 36e5 * 10),
      status: index === 5 ? "pending" : "published",
    };
  });
}

export async function getMerchantCategories(merchantId: string) {
  const offers = await getMerchantOffers(merchantId);
  const groups = new Map<
    string,
    {
      slug: string;
      name: string;
      imageUrl: string;
      productCount: number;
      products: { id: string; name: string; brand: string; imageUrl: string; price: number }[];
    }
  >();

  for (const offer of offers) {
    const current = groups.get(offer.categorySlug);
    const product = {
      id: offer.id,
      name: offer.productName,
      brand: offer.brand,
      imageUrl: offer.imageUrl,
      price: offer.price,
    };
    if (!current) {
      groups.set(offer.categorySlug, {
        slug: offer.categorySlug,
        name: offer.categoryName,
        imageUrl: offer.imageUrl,
        productCount: 1,
        products: [product],
      });
      continue;
    }
    current.productCount += 1;
    if (current.products.length < 12) current.products.push(product);
    if (!current.imageUrl && offer.imageUrl) current.imageUrl = offer.imageUrl;
  }

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
}
