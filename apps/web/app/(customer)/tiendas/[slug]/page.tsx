import { notFound } from "next/navigation";
import { getMerchantBySlug } from "@/lib/data";
import { PlpCatalog } from "@/components/plp/PlpCatalog";

export const dynamic = "force-dynamic";

export default async function StoreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  return (
    <PlpCatalog
      products={merchant.products}
      title={merchant.name}
      crumbs={[{ href: "/tiendas", label: "Tiendas" }, { label: merchant.name }]}
      store={{
        name: merchant.name,
        slug: merchant.slug,
        rating: merchant.rating,
        etaMinutes: merchant.etaMinutes,
        isOpen: merchant.isOpen,
        address: merchant.address,
        deliveryFee: merchant.deliveryFee,
        logoUrl: merchant.logoUrl,
      }}
    />
  );
}
