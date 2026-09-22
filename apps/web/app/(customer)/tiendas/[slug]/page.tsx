import { notFound } from "next/navigation";
import { getMerchantBySlug } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { formatDOP } from "@deuna/utils";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-paper">{merchant.name}</h1>
          <p className="mt-1 text-sm text-paper/60">
            ⭐ {merchant.rating.toFixed(1)} · {merchant.distanceKm.toFixed(1)} km · Entrega{" "}
            {merchant.etaMinutes} min · Delivery {formatDOP(merchant.deliveryFee)}
          </p>
        </div>
        <span
          className={
            merchant.isOpen
              ? "rounded-full bg-teal/15 px-3 py-1 text-sm font-medium text-teal-light"
              : "rounded-full bg-paper/10 px-3 py-1 text-sm font-medium text-paper/50"
          }
        >
          {merchant.isOpen ? "Abierto ahora" : "Cerrado"}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {merchant.products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}