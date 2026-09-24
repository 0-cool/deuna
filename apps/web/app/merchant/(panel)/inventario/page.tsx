import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantOffers } from "@/lib/merchant-data";
import { MerchantInventoryClient } from "@/components/merchant/MerchantInventoryClient";

export const dynamic = "force-dynamic";

export default async function MerchantInventoryPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const offers = await getMerchantOffers(merchant.id);

  return (
    <MerchantInventoryClient
      merchantId={merchant.id}
      offers={offers.map((offer) => ({
        id: offer.id,
        sku: offer.sku,
        productName: offer.productName,
        brand: offer.brand,
        categoryName: offer.categoryName,
        categorySlug: offer.categorySlug,
        imageUrl: offer.imageUrl,
        price: offer.price,
        quantity: offer.quantity,
        lowStockAlert: offer.lowStockAlert,
        updatedAt: offer.updatedAt.toISOString(),
      }))}
    />
  );
}
