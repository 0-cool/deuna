import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantFinance } from "@/lib/merchant-data";
import { MerchantFinanceClient } from "@/components/merchant/MerchantFinanceClient";

export const dynamic = "force-dynamic";

export default async function MerchantFinancePage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const data = await getMerchantFinance(merchant.id);

  return (
    <MerchantFinanceClient
      merchantId={merchant.id}
      commissionPct={data.commissionPct}
      transactions={data.transactions.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        status: item.status as "completed" | "pending" | "cancelled",
      }))}
    />
  );
}
