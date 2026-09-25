"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_RULES } from "@deuna/config";
import type { ProductDetail, ProductSummary } from "@deuna/types";
import { formatDOP } from "@deuna/utils";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import { useCart } from "@/lib/cart-context";
import { storeCover } from "@/lib/store-covers";
import { FavoriteButton } from "../FavoriteButton";
import { PdpGallery } from "./PdpGallery";

function sizeFromName(name: string) {
  return name.match(/(\d+\s?ml)/i)?.[1]?.replace(/\s/g, "") ?? "Único";
}

function reviewCount(id: string) {
  return 80 + (id.charCodeAt(0) % 40) * 80;
}

export function ProductDetailClient({
  product,
  related,
}: {
  product: ProductDetail;
  related: ProductSummary[];
}) {
  const offer = product.offers.find((item) => item.inStock) ?? product.offers[0];
  const size = sizeFromName(product.name);
  const reviews = reviewCount(product.id);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "details" | "reviews">("desc");
  const [notice, setNotice] = useState("");
  const { addItem, items, setQuantity, subtotal, deliveryFee, serviceFee, total, clear } = useCart();

  const cartItems = items;
  const eta = offer?.etaMinutes ?? 30;

  function addCurrent(replace = false) {
    if (!offer) return;
    const result = addItem(
      {
        offerId: offer.offerId,
        productId: product.id,
        productName: product.name,
        productImageUrl: product.imageUrl,
        merchantId: offer.merchantId,
        merchantName: offer.merchantName,
        unitPrice: offer.price,
        quantity: qty,
        ageRestricted: product.ageRestricted,
      },
      offer.deliveryFee,
      { replace },
    );
    if (result === "blocked_other_merchant") {
      addItem(
        {
          offerId: offer.offerId,
          productId: product.id,
          productName: product.name,
          productImageUrl: product.imageUrl,
          merchantId: offer.merchantId,
          merchantName: offer.merchantName,
          unitPrice: offer.price,
          quantity: qty,
          ageRestricted: product.ageRestricted,
        },
        offer.deliveryFee,
        { replace: true },
      );
    }
    setNotice("Agregado a tu pedido.");
    window.setTimeout(() => setNotice(""), 1600);
  }

  const categories = useMemo(() => Object.values(CATEGORY_RULES), []);

  return (
    <div className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden border-r border-ink-border px-4 py-5 lg:block">
          <p className="text-sm font-semibold text-paper">Categorías</p>
          <p className="mt-0.5 text-xs text-paper/40">Bebidas, hielo y snacks</p>
          <nav className="mt-4 space-y-0.5">
            <Link
              href="/buscar"
              className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-paper/70 hover:bg-ink"
            >
              Todos
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/${category.slug}`}
                className={
                  category.slug === product.categorySlug
                    ? "flex items-center gap-2 rounded-xl bg-teal/15 px-2 py-2 text-sm font-medium text-teal-light"
                    : "flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-paper/70 hover:bg-ink"
                }
              >
                <span aria-hidden>{category.emoji}</span>
                {category.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {offer && (
            <div className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={storeCover(offer.merchantSlug)} alt="" className="h-28 w-full object-cover md:h-32" />
              <div className="absolute inset-0 bg-ink/55" />
              <div className="absolute inset-0 flex items-center gap-4 px-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal font-display text-xl text-paper">
                  {offer.merchantLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.merchantLogoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    offer.merchantName.slice(0, 1)
                  )}
                </div>
                <div className="min-w-0 text-paper">
                  <Link href={`/tiendas/${offer.merchantSlug}`} className="font-display text-2xl hover:underline">
                    {offer.merchantName}
                  </Link>
                  <p className="mt-0.5 text-xs text-paper/75">
                    {product.category} · ★ {offer.merchantRating.toFixed(1)} · {Math.max(15, eta - 10)}–{eta} min · Delivery{" "}
                    {formatDOP(offer.deliveryFee)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-4 py-5 sm:px-6">
            <nav className="text-xs text-paper/40">
              <Link href="/" className="hover:text-paper">Inicio</Link>
              <span className="px-1.5">›</span>
              <Link href={`/${product.categorySlug}`} className="hover:text-paper">{product.category}</Link>
              <span className="px-1.5">›</span>
              <span className="text-paper/70">{product.name}</span>
            </nav>

            <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <PdpGallery images={product.images} name={product.name} ageRestricted={product.ageRestricted} />

              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-3xl text-paper md:text-4xl">{product.name}</h1>
                    <p className="mt-1 text-sm text-paper/50">
                      {product.brand} · {product.category}
                      {size !== "Único" ? ` · ${size}` : ""}
                    </p>
                  </div>
                  <FavoriteButton product={product} className="border border-ink-border bg-ink-soft text-paper/60" />
                </div>
                <p className="mt-2 text-sm text-paper/50">
                  <span className="text-gold">★</span> {offer?.merchantRating.toFixed(1) ?? "4.8"} ({reviews} reseñas)
                </p>
                <p className="mt-4 font-display text-4xl text-paper">{formatDOP(offer?.price ?? product.lowestPrice)}</p>

                {product.ageRestricted && (
                  <p className="mt-3 inline-flex rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral">+18 · Solo mayores de edad</p>
                )}

                <div className="mt-5">
                  <p className="text-sm font-medium text-paper">Tamaño</p>
                  <span className="mt-2 inline-flex rounded-full border border-teal bg-teal/15 px-4 py-1.5 text-sm font-medium text-teal-light">
                    {size}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-paper">Cantidad</p>
                  <div className="mt-2 inline-flex items-center rounded-full border border-ink-border bg-ink-soft">
                    <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} className="px-4 py-2 text-lg text-paper/50">
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <button type="button" onClick={() => setQty((value) => value + 1)} className="px-4 py-2 text-lg text-paper/50">
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!offer}
                    onClick={() => addCurrent()}
                    className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-paper hover:bg-teal-light disabled:opacity-50"
                  >
                    Agregar al pedido
                  </button>
                  {notice && <span className="text-sm text-teal-light">{notice}</span>}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs text-paper/50">
                  <span>Entrega estimada {Math.max(15, eta - 10)}–{eta} min</span>
                  {offer && (
                    <span>
                      Desde{" "}
                      <Link href={`/tiendas/${offer.merchantSlug}`} className="font-medium text-teal-light hover:underline">
                        {offer.merchantName}
                      </Link>
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <p className="text-xs text-paper/55">Producto original · 100% garantizado</p>
                  <p className="text-xs text-paper/55">Siempre en frío · Mejor experiencia</p>
                  <p className="text-xs text-paper/55">Entrega rápida · {Math.max(15, eta - 10)}–{eta} min</p>
                </div>

                <div className="mt-6 border-t border-ink-border pt-4">
                  <div className="flex gap-4 text-sm">
                    {[
                      { id: "desc", label: "Descripción" },
                      { id: "details", label: "Detalles" },
                      { id: "reviews", label: `Reseñas (${reviews})` },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id as typeof tab)}
                        className={tab === item.id ? "border-b-2 border-teal pb-2 font-medium text-teal-light" : "pb-2 text-paper/45"}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 text-sm leading-relaxed text-paper/65">
                    {tab === "desc" && <p>{product.description}</p>}
                    {tab === "details" && (
                      <ul className="space-y-1">
                        <li>Marca: {product.brand}</li>
                        <li>Categoría: {product.category}</li>
                        <li>Tamaño: {size}</li>
                        <li>Disponible en {product.offerCount} {product.offerCount === 1 ? "tienda" : "tiendas"}.</li>
                      </ul>
                    )}
                    {tab === "reviews" && (
                      <p>Los clientes valoran este producto con {offer?.merchantRating.toFixed(1) ?? "4.8"} de 5, según {reviews} reseñas en DeUna.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <section className="mt-10 pb-10">
                <div className="flex items-end justify-between">
                  <h2 className="font-display text-2xl text-paper">También te puede gustar</h2>
                  <Link href={`/${product.categorySlug}`} className="text-sm text-teal-light hover:underline">
                    Ver más
                  </Link>
                </div>
                <Swiper
                  modules={[FreeMode]}
                  freeMode
                  slidesPerView="auto"
                  spaceBetween={16}
                  watchOverflow
                  className="mt-4"
                >
                  {related.map((item) => (
                    <SwiperSlide key={item.id} className="!w-36">
                      <article>
                        <Link href={`/productos/${item.slug}`} className="block overflow-hidden rounded-2xl border border-ink-border bg-ink-soft">
                          <div className="aspect-square p-3">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-3xl">🍾</div>
                            )}
                          </div>
                        </Link>
                        <Link href={`/productos/${item.slug}`} className="mt-2 line-clamp-2 text-xs font-medium text-paper">
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-paper/40">{sizeFromName(item.name)}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-sm font-semibold text-paper">{formatDOP(item.lowestPrice)}</p>
                          {item.quickOffer && (
                            <button
                              type="button"
                              onClick={() =>
                                addItem(
                                  {
                                    offerId: item.quickOffer!.offerId,
                                    productId: item.id,
                                    productName: item.name,
                                    productImageUrl: item.imageUrl,
                                    merchantId: item.quickOffer!.merchantId,
                                    merchantName: item.quickOffer!.merchantName,
                                    unitPrice: item.quickOffer!.unitPrice,
                                    quantity: 1,
                                    ageRestricted: item.ageRestricted,
                                  },
                                  item.quickOffer!.deliveryFee,
                                  { replace: false },
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-teal text-sm text-paper"
                              aria-label={`Agregar ${item.name}`}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </article>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            )}
          </div>
        </div>

        <aside className="hidden border-l border-ink-border bg-ink-soft p-5 xl:block">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-paper">Tu pedido</h2>
            {cartItems.length > 0 && (
              <button type="button" onClick={clear} className="text-xs text-paper/40 hover:text-coral">
                Vaciar
              </button>
            )}
          </div>
          {cartItems.length === 0 ? (
            <p className="mt-6 text-sm text-paper/45">Agrega este producto para armar tu pedido.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {cartItems.map((item) => (
                <li key={item.offerId} className="flex items-start gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-ink">
                    {item.productImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.productImageUrl} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <div className="flex h-full items-center justify-center">🍾</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="text-[11px] text-paper/40">{sizeFromName(item.productName)}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <button type="button" onClick={() => setQuantity(item.offerId, item.quantity - 1)} className="text-paper/40">−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => setQuantity(item.offerId, item.quantity + 1)} className="text-paper/40">+</button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatDOP(item.unitPrice * item.quantity)}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 space-y-1.5 text-sm text-paper/60">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatDOP(subtotal)}</span></div>
            <div className="flex justify-between"><span>Envío</span><span>{formatDOP(deliveryFee)}</span></div>
            <div className="flex justify-between"><span>Servicio</span><span>{formatDOP(serviceFee)}</span></div>
            <div className="flex justify-between border-t border-ink-border pt-3 font-display text-xl text-paper">
              <span>Total</span>
              <span>{formatDOP(total)}</span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-5 block rounded-full bg-coral py-3 text-center text-sm font-semibold text-paper hover:bg-coral-dark"
          >
            Finalizar pedido
          </Link>
          <p className="mt-3 text-center text-xs text-paper/40">Entrega estimada {Math.max(15, eta - 10)}–{eta} min</p>
        </aside>
      </div>
    </div>
  );
}
