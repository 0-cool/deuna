"use client";

import Link from "next/link";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { AgeRestrictedCover } from "./AgeRestrictedCover";
import { useAgeVerification } from "@/lib/age-verification";

export function ProductImageSlider({
  images,
  name,
  compact = false,
  ageRestricted = false,
  href,
  fit = "cover",
  controls = true,
}: {
  images: string[];
  name: string;
  compact?: boolean;
  ageRestricted?: boolean;
  href?: string;
  fit?: "cover" | "contain";
  controls?: boolean;
}) {
  const gallery =
    images.length >= 2
      ? images
      : images[0]
        ? [images[0], images[0], images[0]]
        : [];
  const { canViewRestrictedMedia } = useAgeVerification();
  const hideMedia = ageRestricted && !canViewRestrictedMedia;

  const frameClass = compact ? "aspect-square" : "aspect-[4/5]";
  const imageClass =
    fit === "contain"
      ? "absolute inset-0 h-full w-full object-cover object-center p-3"
      : "absolute inset-0 h-full w-full object-cover object-center";

  return (
    <div className={`product-swiper relative overflow-hidden bg-ink ${frameClass}`}>
      {hideMedia && <AgeRestrictedCover compact={compact} />}
      {!hideMedia && gallery.length > 0 ? (
        <Swiper
          modules={controls ? [Pagination] : []}
          pagination={controls ? { clickable: true } : false}
          className="absolute inset-0 !h-full !w-full"
        >
          {gallery.map((src, index) => (
            <SwiperSlide key={`${src}-${index}`} className="!h-full overflow-hidden">
              {href ? (
                <Link href={href} className="relative block h-full w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${name} — vista ${index + 1}`} className={imageClass} />
                </Link>
              ) : (
                <div className="relative h-full w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${name} — vista ${index + 1}`} className={imageClass} />
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      ) : null}
      {!hideMedia && gallery.length === 0 ? (
        <div className="flex h-full items-center justify-center text-4xl" aria-hidden>
          🍾
        </div>
      ) : null}
    </div>
  );
}
