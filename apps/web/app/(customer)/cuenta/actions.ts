"use server";

import { redirect } from "next/navigation";
import {
  getCurrentCustomer,
  registerCustomer,
  verifyCustomerCredentials,
} from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { prisma } from "@deuna/database";
import { revalidatePath } from "next/cache";
import { ZONE_REFERENCE_POINTS, DEFAULT_ZONE_ID } from "@/lib/zones";
import { getSelectedZoneId } from "@/lib/location";

export async function customerLoginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/perfil");

  const user = await verifyCustomerCredentials(email, password);
  if (!user) redirect("/login?error=1");

  await createSession(user.id);
  redirect(next.startsWith("/") ? next : "/perfil");
}

export async function customerLoginInPlaceAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await verifyCustomerCredentials(email, password);
  if (!user) return { error: "invalid" };

  await createSession(user.id);
  revalidatePath("/", "layout");
  return {};
}

function fullNameFrom(formData: FormData) {
  const combined = `${String(formData.get("firstName") ?? "").trim()} ${String(formData.get("lastName") ?? "").trim()}`.trim();
  return combined || String(formData.get("fullName") ?? "").trim();
}

function phoneFrom(formData: FormData) {
  const raw = String(formData.get("phone") ?? "").trim();
  if (!raw) return "";
  return raw.startsWith("+") ? raw : `+1 ${raw}`;
}

export async function customerRegisterInPlaceAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const fullName = fullNameFrom(formData);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = phoneFrom(formData);

  if (!fullName || !email || password.length < 6) return { error: "invalid" };

  const result = await registerCustomer({ fullName, email, password, phone });
  if ("error" in result) return { error: "exists" };

  await createSession(result.user.id);
  revalidatePath("/", "layout");
  return {};
}

export async function customerRegisterAction(formData: FormData): Promise<void> {
  const fullName = fullNameFrom(formData);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = phoneFrom(formData);
  const accepted = formData.get("acceptedTerms") === "on";

  if (!fullName || !email || password.length < 6 || !accepted) {
    redirect("/registro?error=invalid");
  }

  const result = await registerCustomer({ fullName, email, password, phone });
  if ("error" in result) redirect("/registro?error=exists");

  await createSession(result.user.id);
  redirect("/perfil");
}

export async function customerLogoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function saveCustomerLocationAction(formData: FormData): Promise<void> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/perfil");

  const label = String(formData.get("label") ?? "").trim() || "Guardada";
  const line1 = String(formData.get("line1") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const zoneId = String(formData.get("zoneId") ?? (await getSelectedZoneId()));
  const isDefault = formData.get("isDefault") === "on";

  if (!line1) redirect("/perfil?error=address");

  const point = ZONE_REFERENCE_POINTS[zoneId] ?? ZONE_REFERENCE_POINTS[DEFAULT_ZONE_ID]!;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: customer.id },
      data: { isDefault: false },
    });
  }

  await prisma.address.create({
    data: {
      userId: customer.id,
      label,
      line1,
      reference: reference || null,
      city: "Santo Domingo",
      province: "Distrito Nacional",
      latitude: point.lat,
      longitude: point.lng,
      isDefault,
    },
  });

  revalidatePath("/perfil");
  redirect("/perfil?saved=location");
}

export async function deleteCustomerLocationAction(formData: FormData): Promise<void> {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/perfil");

  const addressId = String(formData.get("addressId") ?? "");
  await prisma.address.deleteMany({
    where: { id: addressId, userId: customer.id },
  });
  revalidatePath("/perfil");
}
