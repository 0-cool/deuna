import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantHours, getMerchantPanelContext } from "@/lib/merchant-data";
import { MerchantHoursClient } from "@/components/merchant/MerchantHoursClient";

export const dynamic = "force-dynamic";

export default async function MerchantHoursPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const [hours, context] = await Promise.all([
    getMerchantHours(merchant.id),
    getMerchantPanelContext(merchant.id),
  ]);

  return (
    <MerchantHoursClient
      locationId={hours.locationId}
      storeSlug={context.slug}
      isOpen={hours.isOpen}
      initialHours={hours.hours}
    />
  );
}
