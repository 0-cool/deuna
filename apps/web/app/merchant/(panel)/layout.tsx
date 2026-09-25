import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantPanelContext } from "@/lib/merchant-data";
import { MerchantNav } from "@/components/merchant/MerchantNav";
import { logoutAction } from "../actions";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const merchant = await getCurrentMerchant();
  if (!merchant) redirect("/merchant/login");

  const context = await getMerchantPanelContext(merchant.id);
  const staffName = context.email.split("@")[0]?.replace(/[-._]/g, " ") || merchant.name;

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-ink">
      <aside className="border-b border-ink/8 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-5 py-5">
          <Link href="/merchant" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
              D
            </span>
            <span className="font-display text-xl text-ink">
              De<span className="text-teal">Una</span>
            </span>
          </Link>
        </div>
        <p className="hidden px-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/35 lg:block">
          Panel de tienda
        </p>
        <MerchantNav pendingOrders={context.pendingOrders} />
        <div className="mt-auto hidden p-4 lg:block">
          <div className="rounded-2xl bg-[#FFF4F2] p-4">
            <p className="font-display text-lg text-ink">Haz crecer tu tienda</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              Activa más promociones y llega a más clientes en DeUna.
            </p>
            <Link
              href="/merchant/promociones"
              className="mt-4 inline-flex rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark"
            >
              Ver opciones
            </Link>
          </div>
          <form action={logoutAction} className="mt-3 px-1">
            <button type="submit" className="text-xs text-ink/40 hover:text-coral">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink/8 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{merchant.name}</p>
            <p className="truncate text-xs text-ink/40">{context.address}</p>
          </div>
          <form action="/merchant/productos" className="mx-auto hidden max-w-xl flex-1 md:block">
            <label className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">⌕</span>
              <input
                name="q"
                placeholder="Buscar productos, pedidos, clientes..."
                className="w-full rounded-full border border-ink/10 bg-[#F6F5F2] py-2 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-teal"
              />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/merchant/pedidos"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/50 hover:text-ink"
              aria-label="Notificaciones"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 17h12l-1.2-2.2V10a4.8 4.8 0 1 0-9.6 0v4.8L6 17Z" />
                <path d="M10 17a2 2 0 0 0 4 0" />
              </svg>
              {context.pendingOrders > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
              )}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-ink/10 px-2 py-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper">
                {merchant.name.slice(0, 1)}
              </span>
              <span className="hidden max-w-[8rem] truncate text-xs font-medium capitalize text-ink sm:inline">
                {staffName}
              </span>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
