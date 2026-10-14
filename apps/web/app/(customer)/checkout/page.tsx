"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { formatDOP } from "@deuna/utils";
import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSavedLocations, upsertStoredOrder } from "@/lib/customer-storage";
import { ZONE_REFERENCE_POINTS } from "@/lib/zones";
import type { FulfillmentType, StoredCustomerOrder } from "@deuna/types";

const OrderMap = dynamic(() => import("@/components/OrderMap").then((m) => m.OrderMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-card border border-ink-border bg-ink-soft text-sm text-paper/40">
      Cargando mapa…
    </div>
  ),
});

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
    fulfillment,
    setFulfillment,
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
  const savedLocations = useMemo(() => getSavedLocations(), []);

  const merchantName = items[0]?.merchantName ?? "";
  const etaMinutes = fulfillment === "PICKUP" ? 15 : 28;
  const zone = DEFAULT_DELIVERY_ZONES[0];
  const dropoff = ZONE_REFERENCE_POINTS[zone?.id ?? "dn"] ?? { lat: 18.4655, lng: -69.9312 };

  const canSubmit = useMemo(() => {
    if (!fullName.trim() || !phone.trim()) return false;
    if (fulfillment === "DELIVERY" && !address.trim()) return false;
    if (requiresAgeVerification && !ageConfirmed) return false;
    return true;
  }, [fullName, phone, address, fulfillment, requiresAgeVerification, ageConfirmed]);

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
    const code = generateOrderCode();
    const order: StoredCustomerOrder = {
      code,
      createdAt: new Date().toISOString(),
      fulfillment,
      merchantId: merchantId ?? "",
      merchantName,
      merchantAddress: null,
      items,
      subtotal,
      deliveryFee,
      serviceFee,
      total,
      paymentMethod,
      fullName,
      phone,
      address: fulfillment === "PICKUP" ? "Recoger en tienda" : address,
      reference,
      etaMinutes,
      status: "ORDER_PLACED",
      cancelledAt: null,
      rating: null,
      chat: [],
    };
    upsertStoredOrder(order);
    clear();
    const params = new URLSearchParams({
      total: String(total),
      merchant: merchantName,
      method: paymentMethod,
      fulfillment,
      eta: String(etaMinutes),
    });
    if (merchantId) params.set("merchantId", merchantId);
    router.push(`/pedido/${code}?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <Breadcrumbs items={[{ href: "/carrito", label: "Carrito" }, { label: "Checkout" }]} />
      <h1 className="font-display text-2xl text-paper">Checkout</h1>
      <p className="mt-1 text-sm text-paper/60">Comprando en {merchantName}</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">¿Cómo lo quieres?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["DELIVERY", "PICKUP"] as FulfillmentType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFulfillment(option)}
                className={
                  fulfillment === option
                    ? "rounded-lg border border-teal bg-teal/15 px-3 py-3 text-sm text-paper"
                    : "rounded-lg border border-ink-border px-3 py-3 text-sm text-paper/70"
                }
              >
                {option === "DELIVERY" ? "Delivery a domicilio" : "Paso a recoger al local"}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-paper/60">
            Tiempo estimado: <span className="text-paper">{etaMinutes} min</span>
          </p>
        </div>

        <div className="overflow-hidden rounded-card border border-ink-border">
          <OrderMap
            pickup={{
              lat: 18.4726,
              lng: -69.8901,
              label: merchantName,
              address: merchantName,
            }}
            dropoff={{
              lat: dropoff.lat,
              lng: dropoff.lng,
              label: fulfillment === "PICKUP" ? "Tienda" : "Tu destino",
              address: address || "Tu zona",
            }}
            currentStatus={fulfillment === "PICKUP" ? "READY_FOR_PICKUP" : "ON_THE_WAY"}
          />
        </div>

        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="font-medium text-paper">
            {fulfillment === "PICKUP" ? "Tus datos para recoger" : "Datos de entrega"}
          </p>
          {fulfillment === "DELIVERY" && savedLocations.length > 0 && (
            <label className="mt-3 block text-sm text-paper/80">
              Usar ubicación guardada
              <select
                onChange={(e) => {
                  const selected = savedLocations.find((item) => item.id === e.target.value);
                  if (selected) {
                    setAddress(selected.line1);
                    setReference(selected.reference ?? "");
                  }
                }}
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-paper"
                defaultValue=""
              >
                <option value="">Elegir…</option>
                {savedLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label} — {location.line1}
                  </option>
                ))}
              </select>
            </label>
          )}
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
            {fulfillment === "DELIVERY" && (
              <>
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
              </>
            )}
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
            <span>{fulfillment === "PICKUP" ? "Recoger en tienda" : "Delivery"}</span>
            <span>{fulfillment === "PICKUP" ? "Gratis" : formatDOP(deliveryFee)}</span>
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
