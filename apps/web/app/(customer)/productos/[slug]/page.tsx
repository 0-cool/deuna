import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data";
import { MerchantComparison } from "@/components/MerchantComparison";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-card border border-ink-border bg-ink-soft text-6xl">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full rounded-card object-cover"
            />
          ) : (
            <span aria-hidden>🍾</span>
          )}
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-paper/50">{product.brand}</p>
          <h1 className="mt-1 font-display text-3xl text-paper">{product.name}</h1>

          {product.ageRestricted && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-coral/15 px-3 py-1 text-sm font-medium text-coral">
              🔞 Producto para mayores de edad
            </p>
          )}

          <p className="mt-4 text-paper/70">{product.description}</p>
        </div>
      </div>

      <div className="mt-10">
        <MerchantComparison
          offers={product.offers}
          productId={product.id}
          productName={product.name}
          productImageUrl={product.imageUrl}
          ageRestricted={product.ageRestricted}
        />
      </div>
    </section>
  );
}