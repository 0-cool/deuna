import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@deuna/database";
import { getSessionUserId } from "./session";

export async function verifyCustomerCredentials(
  email: string,
  password: string,
) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { customerProfile: true, addresses: true },
  });
  if (!user || !user.passwordHash || user.role !== "CUSTOMER") return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export async function registerCustomer(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "already_exists" as const };

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      phone: input.phone?.trim() || null,
      passwordHash,
      role: "CUSTOMER",
      customerProfile: {
        create: { fullName: input.fullName.trim() },
      },
    },
    include: { customerProfile: true, addresses: true },
  });

  return { user };
}

export async function getCurrentCustomer() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customerProfile: true, addresses: { orderBy: { createdAt: "desc" } } },
  });

  if (!user || user.role !== "CUSTOMER" || !user.customerProfile) return null;
  return user;
}

export async function verifyMerchantCredentials(
  email: string,
  password: string,
) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { merchant: true },
  });
  if (!user || !user.passwordHash || !user.merchant) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

// Devuelve el Merchant del usuario en sesión, o null si no hay sesión, el usuario no es
// merchant, o su cuenta todavía no tiene una tienda asociada.
export async function getCurrentMerchant() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { merchant: true },
  });

  if (!user || user.role !== "MERCHANT" || !user.merchant) return null;
  return user.merchant;
}

export async function verifyDriverCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { driver: true },
  });
  if (!user || !user.passwordHash || !user.driver) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

// Devuelve el Driver del usuario en sesión, o null si no hay sesión, el usuario no es driver,
// o su cuenta todavía no tiene un perfil de driver asociado. Misma cookie de sesión que
// merchant (session.ts es genérica por diseño) — el filtro por role es lo que separa un panel
// del otro.
export async function getCurrentDriver() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { driver: true },
  });

  if (!user || user.role !== "DRIVER" || !user.driver) return null;
  return user.driver;
}
