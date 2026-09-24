import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantAnalytics } from "@/lib/merchant-data";
import { MerchantAnalyticsClient } from "@/components/merchant/MerchantAnalyticsClient";

export const dynamic = "force-dynamic";

export default async function MerchantAnalyticsPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const orders = await getMerchantAnalytics(merchant.id);

  return (
    <MerchantAnalyticsClient
      orders={orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
      }))}
    />
  );
}
