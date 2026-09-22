"use server";

import { redirect } from "next/navigation";
import { verifyDriverCredentials } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await verifyDriverCredentials(email, password);
  if (!user) {
    redirect("/driver/login?error=1");
  }

  await createSession(user.id);
  redirect("/driver");
}
