import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { NearbyStores } from "@/components/NearbyStores";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getNearbyMerchants, getPopularProducts } from "@/lib/data";

// Evita el pre-render estático en build: los datos dependen de la zona del usuario (cookie)
// y de la base de datos, así que se resuelven en cada request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, merchants, popularProducts] = await Promise.all([
    getCategories(),
    getNearbyMerchants(6),
    getPopularProducts(8),
  ]);

  return (
    <>
      <Hero />
      <CategoryGrid categories={categories} />
      <NearbyStores merchants={merchants} />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="font-display text-2xl text-paper">Productos populares</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {popularProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-card border border-ink-border bg-ink-soft p-6 sm:p-8">
          <h2 className="font-display text-2xl text-paper">Cómo funciona DeUna</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="font-display text-3xl text-teal-light">1</p>
              <p className="mt-1 font-medium text-paper">Busca lo que necesitas</p>
              <p className="mt-1 text-sm text-paper/60">
                Escribe el producto o explora por categoría.
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-teal-light">2</p>
              <p className="mt-1 font-medium text-paper">Compara tiendas cercanas</p>
              <p className="mt-1 text-sm text-paper/60">
                Precio, distancia y tiempo de entrega, uno al lado del otro.
              </p>
            </div>
            <div>
              <p className="font-display text-3xl text-teal-light">3</p>
              <p className="mt-1 font-medium text-paper">Recíbelo en minutos</p>
              <p className="mt-1 text-sm text-paper/60">
                Sigue tu pedido en tiempo real hasta que llegue a tu puerta.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
