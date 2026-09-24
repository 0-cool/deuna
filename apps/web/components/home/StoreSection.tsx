"use client";

import Link from "next/link";
import type { NearbyMerchant } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { FavoriteButton } from "../FavoriteButton";
import { DEFAULT_STORE_COVER, storeCover } from "@/lib/store-covers";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";

function reviewsFor(name: string, rating: number) {
  return Math.round(rating * 180 + name.length * 17);
}

export function StoreSection({ merchants }: { merchants: NearbyMerchant[] }) {
  if (merchants.length === 0) return null;

  return (
    <section className="home-swiper mt-12 overflow-hidden">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-paper">Cerca de ti</h2>
          <p className="mt-1 text-sm text-paper/50">
            Tiendas en Santo Domingo, comparadas por precio, tiempo y reputación.
          </p>
        </div>
        <Link href="/tiendas" className="shrink-0 text-sm text-teal-light hover:underline">
          Ver todo →
        </Link>
      </div>

      <Swiper
        modules={[FreeMode]}
        freeMode
        spaceBetween={16}
        slidesPerView={1.15}
        breakpoints={{
          640: { slidesPerView: 2.1 },
          1024: { slidesPerView: 2.4 },
        }}
        watchOverflow
        className="mt-5 overflow-hidden"
      >
        {merchants.slice(0, 5).map((m) => (
          <SwiperSlide key={m.id}>
            <Link
              href={`/tiendas/${m.slug}`}
              className="group block overflow-hidden rounded-card border border-ink-border bg-ink-soft transition hover:border-teal"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={storeCover(m.slug)}
                  alt={m.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_STORE_COVER;
                  }}
                />
                <span
                  className={
                    m.isOpen
                      ? "absolute left-3 top-3 rounded-full bg-teal px-2 py-0.5 text-[11px] font-medium text-paper"
                      : "absolute left-3 top-3 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-medium text-paper/70"
                  }
                >
                  {m.isOpen ? "Abierto" : "Cerrado"}
                </span>
                <FavoriteButton merchant={m} className="absolute right-3 top-3" />
              </div>
              <div className="p-4">
                <p className="font-medium text-paper">{m.name}</p>
                <p className="mt-1 text-sm text-paper/60">
                  <span className="text-gold">★</span> {m.rating.toFixed(1)} ({reviewsFor(m.name, m.rating)})
                  <span className="mx-1">·</span>
                  {m.distanceKm.toFixed(1)} km
                </p>
                <p className="mt-2 text-sm text-paper/55">
                  Entrega {Math.max(10, m.etaMinutes - 10)}–{m.etaMinutes + 5} min · Delivery{" "}
                  {formatDOP(m.deliveryFee)}
                </p>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
