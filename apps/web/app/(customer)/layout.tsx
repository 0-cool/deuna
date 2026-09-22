import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgeGate } from "@/components/AgeGate";
import { CartProvider } from "@/lib/cart-context";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <AgeGate />
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}