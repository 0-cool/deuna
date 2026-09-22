import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeUna — Tú pide. Nosotros resolvemos.",
  description:
    "DeUna es el marketplace de delivery en República Dominicana para lo que necesitas ahora: alcohol, hielo, mixers, snacks y básicos para fiestas, de las tiendas más cercanas a ti.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="font-sans">
      <body className="min-h-screen bg-ink text-paper antialiased">{children}</body>
    </html>
  );
}