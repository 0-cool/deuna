"use client";

import { useState } from "react";
import { Navigation, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { AgeRestrictedCover } from "../AgeRestrictedCover";
import { useAgeVerification } from "@/lib/age-verification";

export function PdpGallery({
  images,
  name,
  ageRestricted,
}: {
  images: string[];
  name: string;
  ageRestricted: boolean;
}) {
  const gallery = images.filter(Boolean);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const { canViewRestrictedMedia } = useAgeVerification();
  const hideMedia = ageRestricted && !canViewRestrictedMedia;
  const showControls = gallery.length > 1 && !hideMedia;

  return (
    <div>
      <div className="pdp-gallery-swiper overflow-hidden rounded-2xl border border-ink-border bg-ink-soft">
        <div className="relative aspect-square">
          {hideMedia ? (
            <AgeRestrictedCover />
          ) : gallery.length > 0 ? (
            <Swiper
              modules={[Navigation, Thumbs]}
              navigation={showControls}
              thumbs={
                showControls
                  ? { swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }
                  : undefined
              }
              className="absolute inset-0 !h-full !w-full"
            >
              {gallery.map((src, index) => (
                <SwiperSlide key={`${src}-${index}`} className="!h-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${name} — vista ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">🍾</div>
          )}
        </div>
      </div>
      {showControls ? (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[Thumbs]}
          watchSlidesProgress
          slidesPerView="auto"
          spaceBetween={8}
          className="pdp-gallery-thumbs mt-3"
        >
          {gallery.map((src, i) => (
            <SwiperSlide key={`${src}-${i}`} className="!h-16 !w-16 cursor-pointer overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-contain p-1" />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}
    </div>
  );
}
