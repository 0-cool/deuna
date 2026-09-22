"use server";

import { redirect } from "next/navigation";
import { verifyMerchantCredentials } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await verifyMerchantCredentials(email, password);
  if (!user) {
    redirect("/merchant/login?error=1");
  }

  await createSession(user.id);
  redirect("/merchant");
}
