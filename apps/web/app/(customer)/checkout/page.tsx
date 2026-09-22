"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatDOP } from "@deuna/utils";

function generateOrderCode(): string {
  const n = Math.floor(10000 + Math.random() * 90000);
  return `DU-${n}`;
}

export default function CheckoutPage() {
  const {
    items,
    merchantId,
    subtotal,
    deliveryFee,
    serviceFee,
    total,
    requiresAgeVerification,
    clear,
  } = useCart();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH" | "TRANSFER">("CARD");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const merchantName = items[0]?.merchantName ?? "";

  const canSubmit = useMemo(() => {
    if (!fullName.trim() || !phone.trim() || !address.trim()) return false;
    if (requiresAgeVerification && !ageConfirmed) return false;
    return true;
  }, [fullName, phone, address, requiresAgeVerification, ageConfirmed]);

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-paper/70">Tu carrito está vacío.</p>
      </section>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Completa los datos requeridos antes de continuar.");
      return;
    }
    // NOTA DE IMPLEMENTACIÓN: en esta pasada el pedido no se persiste todavía en la base de
    // datos (falta la sesión de customer autenticado). El código de orden y el estado inicial
    // se generan en el cliente solo para poder mostrar el flujo de tracking de punta a punta.
    // La siguiente pasada conecta esto a POST /api/orders usando el schema de Order/Payment
    // ya definido en packages/database.
    const code = generateOrderCode();
    clear();
    const params = new URLSearchParams({
      total: String(total),
      merchant: merchantName,
      method: paymentMethod,
    });
    if (merchantId) params.set("merchantId", merchantId);
    router.push(`/pedido/${code}?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl text-paper">Checkout</h1>
      <p className="mt-1 text-sm text-paper/60">Comprando en {merchantName}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">Datos de entrega</p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-sm text-paper/80">
              Nombre completo
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-paper outline-none focus:border-teal"
                required
              />
            </label>
            <label className="text-sm text-paper/80">
              Teléfono
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="809-000-0000"
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-paper outline-none focus:border-teal"
                required
              />
            </label>
            <label className="text-sm text-paper/80">
              Dirección
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, sector"
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-paper outline-none focus:border-teal"
                required
              />
            </label>
            <label className="text-sm text-paper/80">
              Referencia (opcional)
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Portón negro, al lado de..."
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-paper outline-none focus:border-teal"
              />
            </label>
          </div>
        </div>

        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">Método de pago</p>
          <div className="mt-3 flex flex-col gap-2">
            {(["CARD", "CASH", "TRANSFER"] as const).map((method) => (
              <label
                key={method}
                className="flex items-center gap-2 rounded-lg border border-ink-border px-3 py-2 text-sm text-paper/90"
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                {method === "CARD" && "Tarjeta"}
                {method === "CASH" && "Efectivo"}
                {method === "TRANSFER" && "Transferencia"}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-paper/40">
            Integración real con Azul/CardNET pendiente — ver interfaz PaymentProvider en el spec.
          </p>
        </div>

        {requiresAgeVerification && (
          <div className="rounded-card border border-coral/40 bg-coral/10 p-5">
            <label className="flex items-start gap-3 text-sm text-paper">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                Confirmo que soy mayor de edad y que la persona que recibirá el pedido también
                lo es. Entiendo que el driver puede solicitar confirmar mi edad al momento de la
                entrega.
              </span>
            </label>
          </div>
        )}

        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">Resumen</p>
          <div className="mt-3 flex justify-between text-sm text-paper/70">
            <span>Subtotal</span>
            <span>{formatDOP(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-paper/70">
            <span>Delivery</span>
            <span>{formatDOP(deliveryFee)}</span>
          </div>
          <div className="mt-1 flex justify-between text-sm text-paper/70">
            <span>Service fee</span>
            <span>{formatDOP(serviceFee)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink-border pt-3 font-display text-xl text-paper">
            <span>Total</span>
            <span>{formatDOP(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-coral">{error}</p>}

        <button
          type="submit"
          className="rounded-full bg-teal px-6 py-3 font-medium text-paper transition hover:bg-teal-light disabled:opacity-50"
        >
          Confirmar pedido
        </button>
      </form>
    </section>
  );
}
