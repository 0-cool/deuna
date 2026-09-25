"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { NotificationPrefs, StoredCustomerOrder } from "@deuna/types";
import {
  DEFAULT_NOTIF_PREFS,
  getNotificationPrefs,
  getReadNotificationIds,
  markNotificationsRead,
  saveNotificationPrefs,
} from "@/lib/customer-storage";

type FilterKey = "all" | "orders" | "promos" | "offers" | "news" | "account";

interface InboxItem {
  id: string;
  category: FilterKey;
  icon: string;
  image?: string | null;
  title: string;
  body: string;
  at: string;
  href: string;
}

const CHANNELS: { key: keyof NotificationPrefs; label: string; hint: string; icon: string }[] = [
  { key: "email", label: "Correo electrónico", hint: "Recibe notificaciones en tu email", icon: "✉️" },
  { key: "sms", label: "SMS", hint: "Recibe notificaciones por mensaje de texto", icon: "💬" },
  { key: "push", label: "Notificaciones push", hint: "Recibe avisos en el navegador", icon: "🔔" },
];

const TYPES: { key: keyof NotificationPrefs; label: string; hint: string; icon: string }[] = [
  { key: "orders", label: "Estado de pedidos", hint: "Actualizaciones sobre tus pedidos", icon: "📦" },
  { key: "promos", label: "Promociones y cupones", hint: "Descuentos y ofertas exclusivas", icon: "%" },
  { key: "news", label: "Novedades de tiendas", hint: "Nuevos comercios y productos", icon: "🎁" },
  { key: "recommendations", label: "Recomendaciones", hint: "Basadas en tus gustos y pedidos", icon: "★" },
  { key: "platform", label: "Novedades de la plataforma", hint: "Actualizaciones, funciones y más", icon: "✨" },
  { key: "surveys", label: "Encuestas y opiniones", hint: "Ayúdanos a mejorar tu experiencia", icon: "💬" },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours} hora${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short" });
}

function buildInbox(orders: StoredCustomerOrder[]): InboxItem[] {
  const fromOrders: InboxItem[] = orders.slice(0, 8).map((order) => {
    const image = order.items[0]?.productImageUrl ?? null;
    if (order.status === "DELIVERED") {
      return {
        id: `order-delivered-${order.code}`,
        category: "orders",
        icon: "✅",
        image,
        title: "Tu pedido fue entregado",
        body: `¡Gracias por comprar en ${order.merchantName}! Esperamos verte pronto.`,
        at: order.createdAt,
        href: `/pedido/${order.code}`,
      };
    }
    if (order.status === "CANCELLED") {
      return {
        id: `order-cancelled-${order.code}`,
        category: "orders",
        icon: "🛵",
        image,
        title: "Tu pedido fue cancelado",
        body: `El pedido ${order.code} de ${order.merchantName} se canceló. Se revirtió el método de pago.`,
        at: order.cancelledAt ?? order.createdAt,
        href: `/pedido/${order.code}`,
      };
    }
    return {
      id: `order-active-${order.code}`,
      category: "orders",
      icon: "🛵",
      image,
      title: "Tu pedido está en camino",
      body: `Tu pedido de ${order.merchantName} ya está en camino. Llegará en aprox. ${order.etaMinutes} minutos.`,
      at: order.createdAt,
      href: `/pedido/${order.code}`,
    };
  });

  const extras: InboxItem[] = [
    {
      id: "promo-20",
      category: "promos",
      icon: "%",
      title: "20% de descuento en tu próximo pedido",
      body: "Usa el cupón DEUNA20 y ahorra en licores, hielo y snacks.",
      at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      href: "/perfil?tab=promos",
    },
    {
      id: "promo-weekend",
      category: "offers",
      icon: "🎁",
      title: "Promoción especial de fin de semana",
      body: "Disfruta envío gratis en compras mayores a RD$1,000.",
      at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      href: "/perfil?tab=promos",
    },
    {
      id: "news-stores",
      category: "news",
      icon: "🏪",
      title: "Nuevas tiendas cerca de ti",
      body: "Ahora puedes pedir en DeUna Liquor, Bottle House y más en tu zona.",
      at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      href: "/tiendas",
    },
    {
      id: "rate-order",
      category: "orders",
      icon: "★",
      title: "Califica tu pedido",
      body: "¿Cómo te fue? Tu opinión nos ayuda a mejorar la noche.",
      at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      href: "/perfil?tab=pedidos",
    },
    {
      id: "terms",
      category: "account",
      icon: "🔔",
      title: "Actualización de nuestros términos",
      body: "Hemos actualizado nuestros términos. Conócelos aquí.",
      at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      href: "/",
    },
  ];

  return [...fromOrders, ...extras].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-teal" : "bg-ink-border"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export function ProfileNotifications({ orders }: { orders: StoredCustomerOrder[] }) {
  const inbox = useMemo(() => buildInbox(orders), [orders]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [readIds, setReadIds] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIF_PREFS);

  useEffect(() => {
    setReadIds(getReadNotificationIds());
    setPrefs(getNotificationPrefs());
  }, []);

  const filtered = inbox.filter((item) => filter === "all" || item.category === filter);
  const unread = filtered.filter((item) => !readIds.includes(item.id)).length;

  function markAll() {
    const ids = filtered.map((item) => item.id);
    markNotificationsRead(ids);
    setReadIds(getReadNotificationIds());
  }

  function markOne(id: string) {
    markNotificationsRead([id]);
    setReadIds(getReadNotificationIds());
  }

  function updatePref(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    saveNotificationPrefs(next);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-paper">Notificaciones</h1>
            <p className="mt-1 text-sm text-paper/55">
              Mantente al día con el estado de tus pedidos, promociones y novedades.
            </p>
          </div>
          <button
            type="button"
            onClick={markAll}
            className="text-sm text-teal-light hover:underline"
          >
            Marcar todas como leídas
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["all", `Todas${unread ? ` (${unread})` : ""}`],
              ["orders", "Pedidos"],
              ["promos", "Promociones"],
              ["offers", "Ofertas"],
              ["news", "Novedades"],
              ["account", "Cuenta"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                filter === key ? "bg-teal text-paper" : "border border-ink-border bg-ink-soft text-paper/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="mt-5 divide-y divide-ink-border overflow-hidden rounded-card border border-ink-border bg-ink-soft">
          {filtered.map((item) => {
            const unreadItem = !readIds.includes(item.id);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => markOne(item.id)}
                  className="flex items-start gap-3 px-4 py-4 transition hover:bg-ink"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink text-lg">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium text-paper">
                      {item.title}
                      {unreadItem && <span className="h-1.5 w-1.5 rounded-full bg-teal-light" />}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-paper/55">{item.body}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-paper/40">{relativeTime(item.at)}</p>
                    <p className="mt-2 text-paper/25">→</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="rounded-card border border-ink-border bg-ink-soft p-5 lg:sticky lg:top-24">
        <p className="font-display text-2xl text-paper">Preferencias</p>
        <p className="mt-1 text-sm text-paper/50">Elige qué tipo de notificaciones quieres recibir y por qué canal.</p>

        <p className="mt-5 text-sm font-medium text-paper">Canales de notificación</p>
        <ul className="mt-3 space-y-3">
          {CHANNELS.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-paper">
                  {item.icon} {item.label}
                </p>
                <p className="text-xs text-paper/45">{item.hint}</p>
              </div>
              <Toggle checked={prefs[item.key]} onChange={(value) => updatePref(item.key, value)} />
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm font-medium text-paper">Tipo de notificaciones</p>
        <ul className="mt-3 space-y-3">
          {TYPES.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-paper">
                  {item.icon} {item.label}
                </p>
                <p className="text-xs text-paper/45">{item.hint}</p>
              </div>
              <Toggle checked={prefs[item.key]} onChange={(value) => updatePref(item.key, value)} />
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
