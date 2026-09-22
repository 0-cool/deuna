import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

// Sesión simple: un id de usuario en una cookie httpOnly firmada con HMAC para evitar
// manipulación. No es JWT ni una librería de auth completa (NextAuth, Lucia, etc.) — es
// intencionalmente mínima para el MVP. La arquitectura de roles (User.role) ya soporta
// añadir Google/Apple/OTP después (sección 27 del spec) sin tocar el resto del código,
// reemplazando solo esta capa de sesión.
//
// ⚠️ Define AUTH_SECRET en tu .env antes de producción — el valor por defecto es solo para
// desarrollo local y NO debe usarse con datos reales.

const COOKIE_NAME = "deuna_session";
const SECRET =
  process.env.AUTH_SECRET ?? "dev-secret-change-me-before-production";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const parts = signed.split(".");
  if (parts.length !== 2) return null;
  const value = parts[0];
  const hmac = parts[1];
  if (!value || !hmac) return null;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
