import { notFound } from "next/navigation";
import { CATEGORY_RULES, CategorySlug } from "@deuna/config";
import { PlpCatalog } from "@/components/plp/PlpCatalog";
import { searchProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const slug = category as CategorySlug;
  const rule = CATEGORY_RULES[slug];
  if (!rule) notFound();

  const products = await searchProducts("");

  return (
    <PlpCatalog
      products={products}
      title={rule.label}
      crumbs={[{ label: rule.label }]}
      activeCategory={slug}
    />
  );
}
