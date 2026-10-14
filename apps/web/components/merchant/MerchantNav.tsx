"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/merchant", label: "Resumen", icon: "home" },
  { href: "/merchant/productos", label: "Productos", icon: "box" },
  { href: "/merchant/categorias", label: "Categorías", icon: "grid" },
  { href: "/merchant/inventario", label: "Inventario", icon: "layers" },
  { href: "/merchant/horarios", label: "Horarios", icon: "clock" },
  { href: "/merchant/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/merchant/promociones", label: "Promociones", icon: "tag" },
  { href: "/merchant/finanzas", label: "Finanzas", icon: "wallet" },
  { href: "/merchant/analiticas", label: "Analíticas", icon: "chart" },
  { href: "/merchant/resenas", label: "Reseñas", icon: "star" },
  { href: "/merchant/clientes", label: "Clientes", icon: "users" },
  { href: "/merchant/tienda", label: "Tienda", icon: "store" },
  { href: "/merchant/configuracion", label: "Configuración", icon: "gear" },
] as const;

function NavIcon({ name }: { name: string }) {
  const common = { className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "home":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5Z" />
          <path d="M3.5 7.5V16.5L12 21V12" />
          <path d="M20.5 7.5V16.5L12 21" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3.2 1.8" />
        </svg>
      );
    case "layers":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M12 4 4 8l8 4 8-4-8-4Z" />
          <path d="M4 12l8 4 8-4" />
          <path d="M4 16l8 4 8-4" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "tag":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M3.5 12.5 12.5 3.5H20v7.5L11 20.5 3.5 13v-.5Z" />
          <circle cx="16" cy="8" r="1.2" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 19h16" />
          <path d="M7 16v-5" />
          <path d="M12 16V7" />
          <path d="M17 16v-8" />
        </svg>
      );
    case "wallet":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M15 12.5h4.5V9H15a1.8 1.8 0 0 0 0 3.5Z" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="m12 4 2.2 4.6 5 .7-3.6 3.5.9 5.1L12 15.8 7.5 17.9l.9-5.1L4.8 9.3l5-.7L12 4Z" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.8 19c.8-3 2.8-4.5 5.2-4.5s4.4 1.5 5.2 4.5" />
          <circle cx="17" cy="8.5" r="2.3" />
          <path d="M16 14.6c2 .3 3.6 1.6 4.2 4.4" />
        </svg>
      );
    case "store":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 9.5 5.5 4h13L20 9.5a3 3 0 0 1-3 2.7 3 3 0 0 1-3-2.2 3 3 0 0 1-3 2.2 3 3 0 0 1-3-2.2 3 3 0 0 1-3 2.2A3 3 0 0 1 4 9.5Z" />
          <path d="M6 12.2V20h12v-7.8" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3V20.5M4.8 6.8l1.6 1.6M17.6 15.6l1.6 1.6M3.5 12h2.2M18.3 12H20.5M4.8 17.2l1.6-1.6M17.6 8.4l1.6-1.6" />
        </svg>
      );
  }
}

export function MerchantNav({ pendingOrders }: { pendingOrders: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-0">
      {ITEMS.map((item) => {
        const active = item.href === "/merchant" ? pathname === "/merchant" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex items-center gap-3 rounded-xl bg-coral/10 px-3 py-2.5 text-sm font-medium text-coral"
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/55 transition hover:bg-ink/5 hover:text-ink"
            }
          >
            <NavIcon name={item.icon} />
            <span className="whitespace-nowrap">{item.label}</span>
            {item.href === "/merchant/pedidos" && pendingOrders > 0 && (
              <span className="ml-auto rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {pendingOrders}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
