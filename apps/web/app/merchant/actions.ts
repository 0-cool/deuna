"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@deuna/database";
import type { OrderStatus } from "@deuna/types";
import { CATEGORY_RULES, type CategorySlug } from "@deuna/config";
import { slugify } from "@deuna/utils";
import { destroySession } from "@/lib/session";
import { getCurrentMerchant } from "@/lib/auth";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/merchant/login");
}

async function requireMerchant() {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/merchant/login");
  return merchant;
}

function parsePrice(formData: FormData): number {
  const value = Number(formData.get("price"));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("El precio debe ser un número mayor a cero.");
  }
  return value;
}

function parseQuantity(formData: FormData): number {
  const value = Number(formData.get("quantity"));
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("El inventario debe ser un número igual o mayor a cero.");
  }
  return value;
}

function parseCategorySlug(formData: FormData): CategorySlug {
  const slug = String(formData.get("categorySlug") ?? "");
  if (!Object.prototype.hasOwnProperty.call(CATEGORY_RULES, slug)) {
    throw new Error("Selecciona una categoría válida.");
  }
  return slug as CategorySlug;
}

// Duck-typing en vez de importar la clase Prisma.PrismaClientKnownRequestError: ese namespace
// viene de un reexport `export * from "@prisma/client"` (paquete CommonJS) que Turbopack no
// puede analizar estáticamente y termina emitiendo un warning de build en cada request.
//
// ⚠️ La violación del `onDelete: Restrict` implícito entre OrderItem y ProductOffer (ver
// schema.prisma) la reporta Postgres directo, no Prisma: llega como PrismaClientUnknownRequestError
// SIN `.code` (verificado contra la base real — Prisma solo pone `.code = "P2003"` cuando es él
// quien emula la integridad referencial, no cuando la rechaza la propia base). El mensaje crudo de
// Postgres sí incluye siempre la frase "foreign key constraint", así que es lo que revisamos.
function isForeignKeyConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ((error as { code?: unknown }).code === "P2003") return true;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && /foreign key constraint/i.test(message);
}

// Transiciones que el panel de merchant puede disparar en este MVP (sección 22 del spec:
// Accept/Reject + marcar preparando/listo). Asignar driver y estados posteriores quedan para
// cuando exista la pieza de Delivery/Driver — por ahora eso lo hace Admin manualmente.
const MERCHANT_ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  ORDER_PLACED: ["MERCHANT_ACCEPTED", "CANCELLED"],
  MERCHANT_ACCEPTED: ["PREPARING"],
  PREPARING: ["READY_FOR_PICKUP"],
};

async function setOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/merchant/login");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.merchantId !== merchant.id) {
    throw new Error("Pedido no encontrado para esta tienda.");
  }

  const allowed = MERCHANT_ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`No se puede pasar de ${order.status} a ${nextStatus}.`);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });
  revalidatePath("/merchant/pedidos");
  revalidatePath("/merchant");
}

export async function acceptOrderAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatus(orderId, "MERCHANT_ACCEPTED");
}

export async function rejectOrderAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatus(orderId, "CANCELLED");
}

export async function markPreparingAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatus(orderId, "PREPARING");
}

export async function markReadyAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatus(orderId, "READY_FOR_PICKUP");
}

export async function updateOfferAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();

  const offerId = String(formData.get("offerId"));
  const price = parsePrice(formData);
  const quantity = parseQuantity(formData);
  const isAvailable = formData.get("isAvailable") === "on";

  const offer = await prisma.productOffer.findUnique({
    where: { id: offerId },
  });
  if (!offer || offer.merchantId !== merchant.id) {
    throw new Error("Producto no encontrado para esta tienda.");
  }

  await prisma.productOffer.update({
    where: { id: offerId },
    data: { price, isAvailable },
  });
  await prisma.inventory.upsert({
    where: { productOfferId: offerId },
    update: { quantity },
    create: { productOfferId: offerId, quantity },
  });

  revalidatePath("/merchant/productos");
  revalidatePath("/merchant/inventario");
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const offerId = String(formData.get("offerId"));
  const delta = Number(formData.get("delta"));
  if (!Number.isFinite(delta) || delta === 0) return;

  const offer = await prisma.productOffer.findUnique({
    where: { id: offerId },
    include: { inventory: true },
  });
  if (!offer || offer.merchantId !== merchant.id) {
    throw new Error("Producto no encontrado para esta tienda.");
  }

  const next = Math.max(0, (offer.inventory?.quantity ?? 0) + delta);
  await prisma.inventory.upsert({
    where: { productOfferId: offerId },
    update: { quantity: next },
    create: { productOfferId: offerId, quantity: next },
  });

  revalidatePath("/merchant/inventario");
  revalidatePath("/merchant/productos");
  revalidatePath("/merchant");
}

export async function bulkAdjustStockAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const ids = String(formData.get("offerIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const mode = String(formData.get("mode") ?? "add");
  const amount = Number(formData.get("amount"));
  if (ids.length === 0 || !Number.isFinite(amount)) return;

  const offers = await prisma.productOffer.findMany({
    where: { id: { in: ids }, merchantId: merchant.id },
    include: { inventory: true },
  });

  await Promise.all(
    offers.map((offer) => {
      const current = offer.inventory?.quantity ?? 0;
      const quantity = Math.max(0, mode === "set" ? amount : current + amount);
      return prisma.inventory.upsert({
        where: { productOfferId: offer.id },
        update: { quantity },
        create: { productOfferId: offer.id, quantity },
      });
    }),
  );

  revalidatePath("/merchant/inventario");
  revalidatePath("/merchant/productos");
}

export async function updateLowStockAlertsAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const threshold = Number(formData.get("threshold"));
  if (!Number.isFinite(threshold) || threshold < 0) return;

  const offers = await prisma.productOffer.findMany({
    where: { merchantId: merchant.id },
    select: { id: true },
  });

  await Promise.all(
    offers.map((offer) =>
      prisma.inventory.upsert({
        where: { productOfferId: offer.id },
        update: { lowStockAlert: threshold },
        create: { productOfferId: offer.id, quantity: 0, lowStockAlert: threshold },
      }),
    ),
  );

  revalidatePath("/merchant/inventario");
}

export async function toggleOfferAvailabilityAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const offerId = String(formData.get("offerId"));
  const next = formData.get("next") === "1";

  const offer = await prisma.productOffer.findUnique({
    where: { id: offerId },
  });
  if (!offer || offer.merchantId !== merchant.id) {
    throw new Error("Producto no encontrado para esta tienda.");
  }

  await prisma.productOffer.update({
    where: { id: offerId },
    data: { isAvailable: next },
  });

  revalidatePath("/merchant/productos");
  revalidatePath("/merchant/inventario");
  revalidatePath("/merchant");
}

// Crea un Product nuevo en el catálogo maestro junto con la oferta de este merchant. Usar solo
// cuando el producto todavía no existe en DeUna (ver createOfferForProductAction para el caso
// contrario) — de lo contrario se duplicaría el catálogo y se rompería el comparador de precios.
export async function createProductAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();

  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const categorySlug = parseCategorySlug(formData);
  const price = parsePrice(formData);
  const quantity = parseQuantity(formData);

  if (!name || !brand || !description) {
    throw new Error("Nombre, marca y descripción son obligatorios.");
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) throw new Error("Categoría no encontrada.");
  const rule = CATEGORY_RULES[categorySlug];

  // Evita colisiones de slug si dos productos comparten marca + nombre.
  const baseSlug = slugify(`${brand}-${name}`);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const product = await prisma.product.create({
    data: {
      slug,
      name,
      brand,
      description,
      categoryId: category.id,
      images: imageUrl ? [imageUrl] : [],
      ageRestricted: rule.requiresAgeVerification,
      requiresAgeVerification: rule.requiresAgeVerification,
    },
  });

  await prisma.productOffer.create({
    data: {
      productId: product.id,
      merchantId: merchant.id,
      price,
      isAvailable: true,
      inventory: { create: { quantity } },
    },
  });

  revalidatePath("/merchant/productos");
  redirect("/merchant/productos?notice=created");
}

// Agrega la oferta de este merchant para un Product que ya existe en el catálogo (lo vende otra
// tienda). No crea un Product nuevo — mantiene un solo registro maestro compartido.
export async function createOfferForProductAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();

  const productId = String(formData.get("productId") ?? "");
  const price = parsePrice(formData);
  const quantity = parseQuantity(formData);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Producto no encontrado.");

  const existing = await prisma.productOffer.findUnique({
    where: { productId_merchantId: { productId, merchantId: merchant.id } },
  });
  if (existing) throw new Error("Ya tienes una oferta para este producto.");

  await prisma.productOffer.create({
    data: {
      productId,
      merchantId: merchant.id,
      price,
      isAvailable: true,
      inventory: { create: { quantity } },
    },
  });

  revalidatePath("/merchant/productos");
  redirect("/merchant/productos?notice=created");
}

// Actualiza precio/inventario/disponibilidad de la oferta de este merchant. Nombre, marca,
// descripción, categoría e imagen viven en el Product maestro y compartido — solo se tocan aquí
// si esta tienda es la única que vende ese producto (ver sharedWithOtherMerchants en
// getMerchantOfferDetail); si no, esos campos llegan deshabilitados desde el formulario y el
// bloque de abajo simplemente no se ejecuta.
export async function updateProductAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();

  const offerId = String(formData.get("offerId") ?? "");
  const offer = await prisma.productOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.merchantId !== merchant.id) {
    throw new Error("Producto no encontrado para esta tienda.");
  }

  const price = parsePrice(formData);
  const quantity = parseQuantity(formData);
  const isAvailable = formData.get("isAvailable") === "on";

  await prisma.productOffer.update({
    where: { id: offerId },
    data: { price, isAvailable },
  });
  await prisma.inventory.upsert({
    where: { productOfferId: offerId },
    update: { quantity },
    create: { productOfferId: offerId, quantity },
  });

  const otherOffersCount = await prisma.productOffer.count({
    where: { productId: offer.productId, NOT: { id: offer.id } },
  });

  if (otherOffersCount === 0) {
    const name = String(formData.get("name") ?? "").trim();
    const brand = String(formData.get("brand") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const categorySlug = parseCategorySlug(formData);

    if (!name || !brand || !description) {
      throw new Error("Nombre, marca y descripción son obligatorios.");
    }

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw new Error("Categoría no encontrada.");
    const rule = CATEGORY_RULES[categorySlug];

    await prisma.product.update({
      where: { id: offer.productId },
      data: {
        name,
        brand,
        description,
        categoryId: category.id,
        images: imageUrl ? [imageUrl] : [],
        ageRestricted: rule.requiresAgeVerification,
        requiresAgeVerification: rule.requiresAgeVerification,
      },
    });
  }

  revalidatePath("/merchant/productos");
  revalidatePath(`/merchant/productos/${offerId}/editar`);
  redirect("/merchant/productos?notice=updated");
}

// Elimina la oferta de este merchant. Si tiene pedidos históricos asociados, OrderItem impide el
// borrado a nivel de base de datos a propósito (no tiene onDelete: Cascade, para no perder el
// historial de órdenes) — en ese caso la desactivamos en vez de fallar: desaparece de la tienda
// pero el historial de pedidos queda intacto.
export async function deleteOfferAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const offerId = String(formData.get("offerId") ?? "");

  const offer = await prisma.productOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.merchantId !== merchant.id) {
    throw new Error("Producto no encontrado para esta tienda.");
  }

  try {
    await prisma.productOffer.delete({ where: { id: offerId } });
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      await prisma.productOffer.update({
        where: { id: offerId },
        data: { isAvailable: false },
      });
      await prisma.inventory.upsert({
        where: { productOfferId: offerId },
        update: { quantity: 0 },
        create: { productOfferId: offerId, quantity: 0 },
      });
      revalidatePath("/merchant/productos");
      redirect("/merchant/productos?notice=deactivated");
    }
    throw error;
  }

  revalidatePath("/merchant/productos");
  redirect("/merchant/productos?notice=deleted");
}

export async function saveMerchantHoursAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const locationId = String(formData.get("locationId") ?? "");
  const isOpen = formData.get("isOpen") === "1";
  const raw = String(formData.get("hours") ?? "");

  let hours: unknown = null;
  try {
    hours = JSON.parse(raw);
  } catch {
    return;
  }

  const location = locationId
    ? await prisma.merchantLocation.findFirst({ where: { id: locationId, merchantId: merchant.id } })
    : await prisma.merchantLocation.findFirst({ where: { merchantId: merchant.id } });

  if (!location) return;

  await prisma.merchantLocation.update({
    where: { id: location.id },
    data: { openHours: hours as object, isOpen },
  });

  revalidatePath("/merchant/horarios");
  revalidatePath("/merchant");
}

export async function setMerchantOpenNowAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const locationId = String(formData.get("locationId") ?? "");
  const isOpen = formData.get("isOpen") === "1";

  const location = locationId
    ? await prisma.merchantLocation.findFirst({ where: { id: locationId, merchantId: merchant.id } })
    : await prisma.merchantLocation.findFirst({ where: { merchantId: merchant.id } });

  if (!location) return;

  await prisma.merchantLocation.update({
    where: { id: location.id },
    data: { isOpen },
  });

  revalidatePath("/merchant/horarios");
  revalidatePath("/merchant");
}

export async function saveMerchantSettingsAction(formData: FormData): Promise<void> {
  const merchant = await requireMerchant();
  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const locationId = String(formData.get("locationId") ?? "");
  const isOpen = formData.get("isOpen") === "1";
  const active = formData.get("active") === "1";

  if (!name) return;

  await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      name,
      logoUrl: logoUrl || null,
      status: active ? "ACTIVE" : "SUSPENDED",
    },
  });

  await prisma.user.update({
    where: { id: merchant.userId },
    data: { phone: phone || null },
  });

  const location = locationId
    ? await prisma.merchantLocation.findFirst({ where: { id: locationId, merchantId: merchant.id } })
    : await prisma.merchantLocation.findFirst({ where: { merchantId: merchant.id } });

  if (location && address) {
    await prisma.merchantLocation.update({
      where: { id: location.id },
      data: { address, isOpen },
    });
  }

  revalidatePath("/merchant/configuracion");
  revalidatePath("/merchant");
}
