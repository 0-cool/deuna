import { StoreFilters } from "@/components/StoreFilters";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getAllNearbyMerchants } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const merchants = await getAllNearbyMerchants();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Tiendas" }]} />
      <h1 className="font-display text-2xl text-paper">Tiendas cerca de ti</h1>
      <p className="mt-1 text-sm text-paper/50">Filtra por abiertas, rating, distancia o tiempo de entrega.</p>
      <div className="mt-5">
        <StoreFilters merchants={merchants} />
      </div>
    </section>
  );
}
