import { HomeHero } from "@/components/home/HomeHero";
import { CategoryRow } from "@/components/home/CategoryRow";
import { StoreSection } from "@/components/home/StoreSection";
import { ProductSection } from "@/components/home/ProductSection";
import { CartSidebar } from "@/components/home/CartSidebar";
import { TrackingCard } from "@/components/home/TrackingCard";
import { getCategories, getNearbyMerchants, getPopularProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, merchants, popularProducts] = await Promise.all([
    getCategories(),
    getNearbyMerchants(6),
    getPopularProducts(16),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <div className="min-w-0 overflow-hidden">
          <HomeHero />
          <CategoryRow categories={categories} />
          <StoreSection merchants={merchants} />
          <ProductSection products={popularProducts} />
        </div>
        <div className="mt-8 space-y-4 lg:sticky lg:top-24 lg:mt-0">
          <CartSidebar />
          <TrackingCard />
        </div>
      </div>
    </div>
  );
}
