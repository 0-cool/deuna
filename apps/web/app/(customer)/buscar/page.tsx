import { PlpCatalog } from "@/components/plp/PlpCatalog";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = await searchProducts(query);

  return (
    <PlpCatalog
      products={results}
      title={query ? `“${query}”` : "Buscar"}
      crumbs={[{ label: query ? `Buscar “${query}”` : "Buscar" }]}
    />
  );
}
