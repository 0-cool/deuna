import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantCategories } from "@/lib/merchant-data";
import { MerchantCategoriesClient } from "@/components/merchant/MerchantCategoriesClient";

export const dynamic = "force-dynamic";

export default async function MerchantCategoriesPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const categories = await getMerchantCategories(merchant.id);

  return <MerchantCategoriesClient merchantId={merchant.id} categories={categories} />;
}
