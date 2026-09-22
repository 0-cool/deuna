import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMerchant } from "@/lib/auth";
import { logoutAction } from "../actions";

const NAV_ITEMS = [
  { href: "/merchant", label: "Dashboard" },
  { href: "/merchant/productos", label: "Productos" },
  { href: "/merchant/pedidos", label: "Pedidos" },
];

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/merchant/login");

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row sm:gap-8">
      <aside className="flex flex-shrink-0 flex-row items-center justify-between gap-4 border-b border-ink-border pb-4 sm:w-52 sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
        <div>
          <Link href="/merchant" className="font-display text-lg text-paper">
            {merchant.name}
          </Link>
          <p className="text-xs text-paper/40">Panel de comercio</p>
        </div>

        <nav className="flex gap-1 sm:mt-4 sm:flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-paper/80 transition hover:bg-ink-soft"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form action={logoutAction} className="sm:mt-auto">
          <button type="submit" className="text-sm text-paper/40 hover:text-coral">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <div className="flex-1 pb-10">{children}</div>
    </div>
  );
}