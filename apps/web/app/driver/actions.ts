"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@deuna/database";
import type { OrderStatus, VehicleType } from "@deuna/types";
import { destroySession } from "@/lib/session";
import { getCurrentDriver } from "@/lib/auth";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/driver/login");
}

async function requireDriver() {
  const driver = await getCurrentDriver();
  if (!driver) redirect("/driver/login");
  return driver;
}

// P2002 es el código "conocido" que Prisma sí traduce de forma confiable para violaciones de
// constraint único (a diferencia del RESTRICT de foreign key — ver isForeignKeyConstraintError
// en app/merchant/actions.ts, verificado por separado contra la base real: ese caso NO trae
// `.code`, este sí).
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

const VEHICLE_TYPES: VehicleType[] = ["MOTORCYCLE", "CAR", "BICYCLE", "ON_FOOT"];

export async function updateDriverProfileAction(formData: FormData): Promise<void> {
  const driver = await requireDriver();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vehicleType = String(formData.get("vehicleType") ?? "");
  const vehiclePlate = String(formData.get("vehiclePlate") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!fullName || !phone) {
    throw new Error("Nombre y teléfono son obligatorios.");
  }
  if (!VEHICLE_TYPES.includes(vehicleType as VehicleType)) {
    throw new Error("Selecciona un tipo de vehículo válido.");
  }

  await prisma.driver.update({
    where: { id: driver.id },
    data: {
      fullName,
      phone,
      vehicleType: vehicleType as VehicleType,
      vehiclePlate: vehiclePlate || null,
      photoUrl: photoUrl || null,
      isActive,
    },
  });

  revalidatePath("/driver");
  redirect("/driver?notice=updated");
}

// Toma un pedido del pool abierto (READY_FOR_PICKUP sin driver asignado). Crea el Delivery y
// avanza el Order a DRIVER_ASSIGNED. Si dos drivers lo intentan a la vez, el segundo choca con
// el constraint único de Delivery.orderId (P2002) — lo convertimos en un mensaje amigable en vez
// de un 500.
export async function claimOrderAction(formData: FormData): Promise<void> {
  const driver = await requireDriver();
  const orderId = String(formData.get("orderId") ?? "");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status !== "READY_FOR_PICKUP") {
    throw new Error("Este pedido ya no está disponible para tomar.");
  }

  try {
    await prisma.delivery.create({
      data: { orderId, driverId: driver.id, assignedAt: new Date() },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("Otro driver ya tomó este pedido.");
    }
    throw error;
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: "DRIVER_ASSIGNED" } });

  revalidatePath("/driver/pedidos");
}

// Transiciones que el driver puede disparar sobre un pedido que ya tomó (ver
// MERCHANT_ALLOWED_TRANSITIONS en app/merchant/actions.ts para el equivalente del merchant).
const DRIVER_ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  DRIVER_ASSIGNED: ["PICKED_UP"],
  PICKED_UP: ["ON_THE_WAY"],
  ON_THE_WAY: ["DELIVERED"],
};

async function setOrderStatusForDriver(orderId: string, nextStatus: OrderStatus) {
  const driver = await requireDriver();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });
  if (!order || !order.delivery || order.delivery.driverId !== driver.id) {
    throw new Error("Pedido no encontrado para este driver.");
  }

  const allowed = DRIVER_ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new Error(`No se puede pasar de ${order.status} a ${nextStatus}.`);
  }

  await prisma.order.update({ where: { id: orderId }, data: { status: nextStatus } });

  if (nextStatus === "PICKED_UP") {
    await prisma.delivery.update({ where: { orderId }, data: { pickedUpAt: new Date() } });
  } else if (nextStatus === "DELIVERED") {
    await prisma.delivery.update({ where: { orderId }, data: { deliveredAt: new Date() } });
  }

  revalidatePath("/driver/pedidos");
}

export async function markPickedUpAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatusForDriver(orderId, "PICKED_UP");
}

export async function markOnTheWayAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatusForDriver(orderId, "ON_THE_WAY");
}

export async function markDeliveredAction(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId"));
  await setOrderStatusForDriver(orderId, "DELIVERED");
}
