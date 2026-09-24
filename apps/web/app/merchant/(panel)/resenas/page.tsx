import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantReviews } from "@/lib/merchant-data";
import { MerchantReviewsClient } from "@/components/merchant/MerchantReviewsClient";

export const dynamic = "force-dynamic";

export default async function MerchantReviewsPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const reviews = await getMerchantReviews(merchant.id);

  return (
    <MerchantReviewsClient
      merchantId={merchant.id}
      reviews={reviews.map((review) => ({
        ...review,
        createdAt: review.createdAt.toISOString(),
        status: review.status as "published" | "pending" | "reported",
      }))}
    />
  );
}
