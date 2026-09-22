import { notFound } from "next/navigation";
import { CATEGORY_RULES, CategorySlug } from "@deuna/config";
import { ProductCard } from "@/components/ProductCard";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const slug = category as CategorySlug;
  const rule = CATEGORY_RULES[slug];
  if (!rule) notFound();

  const products = await searchProducts("", slug);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="flex items-center gap-2 font-display text-3xl text-paper">
        <span aria-hidden>{rule.emoji}</span> {rule.label}
      </h1>
      {rule.requiresAgeVerification && (
        <p className="mt-1 text-sm text-coral">🔞 Categoría para mayores de edad</p>
      )}

      {products.length === 0 ? (
        <p className="mt-8 text-paper/60">Todavía no hay productos disponibles en esta categoría.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}