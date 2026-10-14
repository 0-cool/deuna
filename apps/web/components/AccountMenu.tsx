import Link from "next/link";
import { getCurrentCustomer } from "@/lib/auth";
import { customerLogoutAction } from "@/app/(customer)/cuenta/actions";
import { AuthEntryButton } from "./AuthModal";

export async function AccountMenu() {
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="flex items-center gap-2">
        <AuthEntryButton mode="login" />
        <AuthEntryButton
          mode="register"
          className="hidden rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light sm:inline-flex"
        >
          Registrarse
        </AuthEntryButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/perfil"
        className="flex items-center gap-2 rounded-full border border-ink-border bg-ink-soft px-3 py-2 text-sm font-medium text-paper transition hover:border-teal"
      >
        <span aria-hidden>👤</span>
        <span className="hidden max-w-[8rem] truncate sm:inline">
          {customer.customerProfile?.fullName ?? "Perfil"}
        </span>
      </Link>
      <form action={customerLogoutAction}>
        <button type="submit" className="hidden text-xs text-paper/40 hover:text-coral sm:inline">
          Salir
        </button>
      </form>
    </div>
  );
}
