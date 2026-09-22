import { ProductCard } from "@/components/ProductCard";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = query ? await searchProducts(query) : [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl text-paper">
        {query ? (
          <>
            Resultados para <span className="text-teal-light">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          "¿Qué necesitas?"
        )}
      </h1>

      {query && (
        <p className="mt-1 text-sm text-paper/60">
          {results.length} {results.length === 1 ? "producto encontrado" : "productos encontrados"}
        </p>
      )}

      {query && results.length === 0 && (
        <div className="mt-10 rounded-card border border-ink-border bg-ink-soft p-8 text-center">
          <p className="text-paper/80">No encontramos nada para &ldquo;{query}&rdquo;.</p>
          <p className="mt-1 text-sm text-paper/50">
            Prueba con el nombre de la marca o revisa la ortografía.
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}