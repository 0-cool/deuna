import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDriver } from "@/lib/auth";
import { logoutAction } from "../actions";

const NAV_ITEMS = [
  { href: "/driver", label: "Mi perfil" },
  { href: "/driver/pedidos", label: "Pedidos" },
];

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const driver = await getCurrentDriver();
  if (!driver) redirect("/driver/login");

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 sm:flex-row sm:gap-8">
      <aside className="flex flex-shrink-0 flex-row items-center justify-between gap-4 border-b border-ink-border pb-4 sm:w-52 sm:flex-col sm:items-stretch sm:border-b-0 sm:border-r sm:pb-0 sm:pr-6">
        <div>
          <Link href="/driver" className="font-display text-lg text-paper">
            {driver.fullName}
          </Link>
          <p className="text-xs text-paper/40">Panel de repartidor</p>
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
