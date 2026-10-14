import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgeGate } from "@/components/AgeGate";
import { LocationPrompt } from "@/components/LocationPrompt";
import { AuthModal } from "@/components/AuthModal";
import { CartProvider } from "@/lib/cart-context";
import { AgeVerificationProvider } from "@/lib/age-verification";
import { AuthModalProvider } from "@/lib/auth-modal";
import { FavoritesProvider } from "@/lib/favorites";
import { getCurrentZoneLabel } from "@/lib/data";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const zoneLabel = await getCurrentZoneLabel();

  return (
    <CartProvider>
      <AgeVerificationProvider>
        <AuthModalProvider>
          <FavoritesProvider>
          <AgeGate />
          <AuthModal />
          <LocationPrompt currentZoneName={zoneLabel} />
          <Header />
          <main>{children}</main>
          <Footer />
        </FavoritesProvider>
        </AuthModalProvider>
      </AgeVerificationProvider>
    </CartProvider>
  );
}
