import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantSettings } from "@/lib/merchant-data";
import { MerchantSettingsClient } from "@/components/merchant/MerchantSettingsClient";

export const dynamic = "force-dynamic";

export default async function MerchantSettingsPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const settings = await getMerchantSettings(merchant.id);

  return <MerchantSettingsClient merchantId={merchant.id} core={settings} />;
}
