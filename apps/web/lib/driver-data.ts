import "server-only";
import { prisma } from "@deuna/database";

// Incluye lo necesario para mostrarle al driver dónde recoger (merchant + su ubicación) y dónde
// entregar (customer + dirección), sin exponer más del pedido de lo que le corresponde ver.
const ORDER_INCLUDE = {
  merchant: { include: { locations: true } },
  address: true,
  customerProfile: true,
  items: true,
} as const;

function toDriverOrderSummary(order: {
  id: string;
  code: string;
  status: string;
  total: unknown;
  createdAt: Date;
  merchant: { name: string; locations: { address: string }[] };
  address: { line1: string; city: string };
  customerProfile: { fullName: string };
  items: { quantity: number }[];
}) {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    merchantName: order.merchant.name,
    pickupAddress: order.merchant.locations[0]?.address ?? "Dirección de tienda no disponible",
    customerName: order.customerProfile.fullName,
    dropoffAddress: `${order.address.line1}, ${order.address.city}`,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// Pedidos que el merchant ya dejó listos para recoger y que ningún driver ha tomado todavía —
// pool abierto: cualquier driver puede tomarlos (no hay matching por zona/geolocalización aún).
export async function getAvailablePickups() {
  const orders = await prisma.order.findMany({
    where: { status: "READY_FOR_PICKUP", delivery: null },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return orders.map(toDriverOrderSummary);
}

// Pedidos que este driver ya tomó y todavía no entrega.
export async function getDriverActiveOrders(driverId: string) {
  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["DRIVER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"] },
      delivery: { driverId },
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return orders.map(toDriverOrderSummary);
}

export async function getDriverHistory(driverId: string) {
  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED", delivery: { driverId } },
    include: ORDER_INCLUDE,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
  return orders.map(toDriverOrderSummary);
}

export async function getDriverStats(driverId: string) {
  const [activeCount, deliveredTodayCount] = await Promise.all([
    prisma.order.count({
      where: {
        status: { in: ["DRIVER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"] },
        delivery: { driverId },
      },
    }),
    prisma.order.count({
      where: {
        status: "DELIVERED",
        delivery: { driverId },
        updatedAt: { gte: startOfToday() },
      },
    }),
  ]);
  return { activeCount, deliveredTodayCount };
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
