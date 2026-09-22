import { MerchantGrid } from "@/components/NearbyStores";
import { getAllNearbyMerchants } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const merchants = await getAllNearbyMerchants();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl text-paper">Tiendas cerca de ti</h1>
      <div className="mt-5">
        <MerchantGrid merchants={merchants} />
      </div>
    </section>
  );
}
