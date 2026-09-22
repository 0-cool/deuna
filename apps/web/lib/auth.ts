import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@deuna/database";
import { getSessionUserId } from "./session";

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
