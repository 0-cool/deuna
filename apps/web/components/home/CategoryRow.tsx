"use client";

import Link from "next/link";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";

interface CategoryTile {
  slug: string;
  label: string;
  emoji: string;
  requiresAgeVerification?: boolean;
}

export function CategoryRow({ categories }: { categories: CategoryTile[] }) {
  return (
    <section className="home-swiper mt-10 overflow-hidden">
      <Swiper
        modules={[FreeMode]}
        freeMode
        slidesPerView="auto"
        spaceBetween={12}
        watchOverflow
        className="overflow-hidden"
      >
        {categories.map((cat) => (
          <SwiperSlide key={cat.slug} className="!w-[112px]">
            <Link
              href={`/${cat.slug}`}
              className="relative flex h-full flex-col items-center gap-2 rounded-card border border-ink-border bg-ink-soft px-3 py-4 text-center transition hover:-translate-y-0.5 hover:border-teal"
            >
              {cat.requiresAgeVerification && (
                <span className="absolute right-2 top-2 rounded-full bg-coral/15 px-1.5 py-0.5 text-[9px] font-bold text-coral">
                  +18
                </span>
              )}
              <span className="text-3xl" aria-hidden>
                {cat.emoji}
              </span>
              <span className="text-xs font-medium text-paper/85">{cat.label}</span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
