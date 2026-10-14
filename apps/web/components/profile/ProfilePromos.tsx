"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { UsedCoupon } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { getUsedCoupons, markCouponUsed } from "@/lib/customer-storage";

type FilterKey = "all" | "available" | "used" | "offers";

const COUPONS = [
  {
    id: "first-20",
    headline: "20% OFF",
    title: "20% de descuento en tu primer pedido",
    min: 500,
    expires: "30 sept 2026",
    savedAmount: 140,
  },
  {
    id: "licores-150",
    headline: "RD$150 OFF",
    title: "En tiendas de licores y bebidas",
    min: 1000,
    expires: "25 sept 2026",
    savedAmount: 150,
  },
  {
    id: "hielo-100",
    headline: "RD$100 OFF",
    title: "En hielo, mixers y snacks",
    min: 600,
    expires: "28 sept 2026",
    savedAmount: 100,
  },
  {
    id: "2x1-snacks",
    headline: "2x1",
    title: "En snacks seleccionados",
    min: 0,
    expires: "20 sept 2026",
    savedAmount: 75,
  },
  {
    id: "envio-gratis",
    headline: "Envío gratis",
    title: "En compras de +RD$1,500",
    min: 1500,
    expires: "31 sept 2026",
    savedAmount: 150,
  },
] as const;

const OFFERS = [
  {
    title: "Ahorra en mixers",
    href: "/mixers",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Licores con descuento",
    href: "/ron",
    image: "https://images.unsplash.com/photo-1569529465841-dfecdab9603a?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Snacks por menos",
    href: "/snacks",
    image: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Hielo y bebidas listos",
    href: "/hielo",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  },
];

function formatUsedDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

export function ProfilePromos() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [used, setUsed] = useState<UsedCoupon[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setUsed(getUsedCoupons());
  }, []);

  const available = useMemo(
    () => COUPONS.filter((coupon) => !used.some((item) => item.id === coupon.id)),
    [used],
  );

  function useCoupon(coupon: (typeof COUPONS)[number]) {
    markCouponUsed({
      id: coupon.id,
      title: coupon.title,
      usedAt: new Date().toISOString(),
      savedAmount: coupon.savedAmount,
      orderCode: null,
    });
    setUsed(getUsedCoupons());
    setNotice(`Cupón “${coupon.headline}” listo. Se aplicará en tu próximo checkout.`);
  }

  const showAvailable = filter === "all" || filter === "available";
  const showOffers = filter === "all" || filter === "offers";
  const showUsed = filter === "all" || filter === "used";

  return (
    <section>
      <h1 className="font-display text-3xl text-paper">Promociones</h1>
      <p className="mt-1 text-sm text-paper/55">
        Ahorra más en tus pedidos con descuentos, cupones y beneficios exclusivos.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {(
          [
            ["all", "Todas"],
            ["available", `Cupones disponibles (${available.length})`],
            ["used", `Cupones usados (${used.length})`],
            ["offers", "Ofertas especiales"],
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

      {notice && (
        <p className="mt-4 rounded-card border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal-light">{notice}</p>
      )}

      {filter !== "used" && (
        <div className="relative mt-6 overflow-hidden rounded-card border border-ink-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-banner.jpg?v=2" alt="" className="h-52 w-full object-cover object-[center_30%] md:h-56" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
            <p className="text-sm text-gold">★ DeUna Plus</p>
            <h2 className="mt-1 font-display text-3xl text-paper md:text-4xl">Envío gratis y más</h2>
            <p className="mt-2 max-w-md text-sm text-paper/70">
              Promociones exclusivas, cupones extra y prioridad en las noches más pedidas.
            </p>
            <Link
              href="/tiendas"
              className="mt-4 inline-flex w-fit rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light"
            >
              Conocer beneficios
            </Link>
          </div>
        </div>
      )}

      {showAvailable && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-paper">Cupones disponibles ({available.length})</h2>
          </div>
          {available.length === 0 ? (
            <p className="mt-4 text-sm text-paper/50">Ya usaste los cupones disponibles por ahora.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {available.map((coupon) => (
                <article key={coupon.id} className="flex flex-col rounded-card border border-ink-border bg-ink-soft p-4">
                  <p className="font-display text-2xl text-teal-light">{coupon.headline}</p>
                  <p className="mt-2 text-sm text-paper">{coupon.title}</p>
                  <p className="mt-2 text-xs text-paper/45">
                    {coupon.min > 0 ? `Mín. ${formatDOP(coupon.min)}` : "Sin mínimo"} · vale hasta {coupon.expires}
                  </p>
                  <button
                    type="button"
                    onClick={() => useCoupon(coupon)}
                    className="mt-4 rounded-full bg-teal px-3 py-2 text-sm text-paper hover:bg-teal-light"
                  >
                    Usar cupón
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {showOffers && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-paper">Ofertas especiales para ti</h2>
            <Link href="/buscar" className="text-sm text-teal-light hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {OFFERS.map((offer) => (
              <Link
                key={offer.title}
                href={offer.href}
                className="group relative h-36 overflow-hidden rounded-card border border-ink-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={offer.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-medium text-paper">{offer.title}</p>
                  <p className="text-sm text-teal-light">Ver ofertas →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showUsed && (
        <div className="mt-10">
          <h2 className="font-display text-2xl text-paper">Cupones usados recientemente</h2>
          {used.length === 0 ? (
            <p className="mt-4 text-sm text-paper/50">Cuando uses un cupón, el historial aparecerá aquí.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-card border border-ink-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-ink-soft text-paper/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Cupón</th>
                    <th className="px-4 py-3 font-medium">Pedido</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Ahorro</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {used.map((coupon) => (
                    <tr key={`${coupon.id}-${coupon.usedAt}`} className="border-t border-ink-border">
                      <td className="px-4 py-3 text-paper">{coupon.title}</td>
                      <td className="px-4 py-3 text-paper/55">{coupon.orderCode ?? "Próximo pedido"}</td>
                      <td className="px-4 py-3 text-paper/55">{formatUsedDate(coupon.usedAt)}</td>
                      <td className="px-4 py-3 text-teal-light">−{formatDOP(coupon.savedAmount)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-paper/10 px-2 py-0.5 text-xs text-paper/60">Usado</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
