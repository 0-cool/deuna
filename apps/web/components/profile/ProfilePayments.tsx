"use client";

import { useEffect, useMemo, useState } from "react";
import type { SavedCardBrand, SavedPaymentKind, SavedPaymentMethod } from "@deuna/types";
import { getSavedPaymentMethods, removePaymentMethod, savePaymentMethod } from "@/lib/customer-storage";

const KINDS: { id: SavedPaymentKind; label: string; icon: string }[] = [
  { id: "CARD", label: "Tarjeta", icon: "💳" },
  { id: "DEBIT", label: "Débito", icon: "🏦" },
  { id: "CASH", label: "Efectivo", icon: "💵" },
  { id: "WALLET", label: "Billetera", icon: "📱" },
];

function detectBrand(digits: string): SavedCardBrand {
  if (digits.startsWith("4")) return "visa";
  const prefix2 = Number(digits.slice(0, 2));
  const prefix4 = Number(digits.slice(0, 4));
  if ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720)) return "mastercard";
  return "other";
}

function brandLabel(brand: SavedCardBrand | null, kind: SavedPaymentKind) {
  if (kind === "CASH") return "Pago contra entrega";
  if (kind === "WALLET") return "Billetera DeUna";
  if (brand === "visa") return "Visa";
  if (brand === "mastercard") return "Mastercard";
  return kind === "DEBIT" ? "Tarjeta de débito" : "Tarjeta";
}

function formatCardInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function ProfilePayments({ defaultHolderName }: { defaultHolderName: string }) {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [formOpen, setFormOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kind, setKind] = useState<SavedPaymentKind>("CARD");
  const [holderName, setHolderName] = useState(defaultHolderName);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [isDefault, setIsDefault] = useState(methods.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMethods(getSavedPaymentMethods());
  }, []);

  const needsCard = kind === "CARD" || kind === "DEBIT";
  const brand = useMemo(() => detectBrand(cardNumber.replace(/\D/g, "")), [cardNumber]);

  function refresh() {
    setMethods(getSavedPaymentMethods());
  }

  function resetForm() {
    setEditingId(null);
    setKind("CARD");
    setHolderName(defaultHolderName);
    setCardNumber("");
    setExpiry("");
    setIsDefault(methods.length === 0);
    setError(null);
    setFormOpen(true);
  }

  function startEdit(method: SavedPaymentMethod) {
    setEditingId(method.id);
    setKind(method.kind);
    setHolderName(method.holderName);
    setCardNumber(method.last4 ? `•••• •••• •••• ${method.last4}` : "");
    setExpiry(method.expiry ?? "");
    setIsDefault(method.isDefault);
    setError(null);
    setFormOpen(true);
  }

  function persist() {
    const digits = cardNumber.replace(/\D/g, "");
    const isMasked = cardNumber.includes("•");
    if (needsCard && !isMasked && (digits.length < 13 || digits.length > 19)) {
      setError("Ingresa un número de tarjeta válido. Solo guardamos los últimos 4 dígitos.");
      return;
    }
    if (needsCard && expiry && !/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("La fecha debe verse como MM/AA.");
      return;
    }

    const existing = methods.find((item) => item.id === editingId);
    const last4 = needsCard
      ? isMasked
        ? existing?.last4 ?? digits.slice(-4)
        : digits.slice(-4)
      : null;

    const next: SavedPaymentMethod = {
      id:
        editingId ??
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `pay-${Date.now()}`),
      kind,
      brand: needsCard ? (isMasked ? existing?.brand ?? "other" : detectBrand(digits)) : null,
      holderName: holderName.trim() || defaultHolderName || "Cliente",
      last4,
      expiry: needsCard ? expiry || null : null,
      isDefault: isDefault || methods.length === 0,
      updatedAt: new Date().toISOString(),
    };
    savePaymentMethod(next);
    refresh();
    resetForm();
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-paper">Mis métodos de pago</h1>
            <p className="mt-1 text-sm text-paper/55">
              Administra tus tarjetas, opciones de pago y preferencias para pagar más rápido.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light"
          >
            + Agregar método de pago
          </button>
        </div>

        {methods.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-ink-border bg-ink-soft p-8 text-center">
            <p className="text-paper/75">Todavía no tienes métodos guardados.</p>
            <p className="mt-1 text-sm text-paper/45">Puedes agregar efectivo, transferencia o una tarjeta tokenizada.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {methods.map((method) => (
              <li
                key={method.id}
                className={`rounded-card border bg-ink-soft p-4 ${method.isDefault ? "border-teal" : "border-ink-border"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink text-lg">
                      {method.kind === "CASH" ? "💵" : method.kind === "WALLET" ? "📱" : method.brand === "mastercard" ? "MC" : "VISA"}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-paper">
                          {brandLabel(method.brand, method.kind)}
                          {method.last4 ? ` terminada en ${method.last4}` : ""}
                        </p>
                        {method.isDefault && (
                          <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-medium text-teal-light">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-paper/55">Titular: {method.holderName}</p>
                      {method.expiry && <p className="text-sm text-paper/45">Expira {method.expiry}</p>}
                      {method.kind === "CASH" && (
                        <p className="text-sm text-paper/45">Paga en efectivo al recibir el pedido.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(method)}
                      className="rounded-full border border-ink-border px-3 py-1.5 text-sm text-paper hover:border-teal"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removePaymentMethod(method.id);
                        refresh();
                      }}
                      className="rounded-full px-3 py-1.5 text-sm text-paper/40 hover:text-coral"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 rounded-card border border-ink-border bg-ink-soft p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-paper">Promociones bancarias</p>
            <span className="text-xs text-paper/40">Sujetas a cada banco</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink p-3 text-sm text-paper/70">
              10% de descuento con Visa seleccionada
            </div>
            <div className="rounded-xl bg-ink p-3 text-sm text-paper/70">
              15% de cashback con Mastercard
            </div>
            <div className="rounded-xl bg-ink p-3 text-sm text-paper/70">
              RD$200 de descuento en débito Banreservas
            </div>
          </div>
        </div>
      </section>

      <aside className={`rounded-card border border-ink-border bg-ink-soft p-5 lg:sticky lg:top-24 ${formOpen ? "block" : "hidden lg:block"}`}>
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-2xl text-paper">
            {editingId ? "Editar método" : "Agregar nuevo método"}
          </p>
          <button type="button" onClick={() => setFormOpen(false)} className="text-paper/40 hover:text-paper lg:hidden">
            Cerrar
          </button>
        </div>

        <p className="mt-5 text-sm font-medium text-paper">Tipo de método de pago</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setKind(item.id);
                setError(null);
              }}
              className={`rounded-xl border px-2 py-3 text-center text-xs ${
                kind === item.id ? "border-teal bg-teal/15 text-teal-light" : "border-ink-border bg-ink text-paper/70"
              }`}
            >
              <span className="block text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm text-paper/70">
          Nombre del titular
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Ej. Juan Rojas"
            className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        {needsCard && (
          <>
            <label className="mt-3 block text-sm text-paper/70">
              Número de tarjeta
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="XXXX XXXX XXXX XXXX"
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
              />
            </label>
            <p className="mt-1 text-xs text-paper/40">
              {cardNumber.replace(/\D/g, "").length >= 4
                ? `${brandLabel(brand, kind)} · solo se guardan los últimos 4`
                : "No guardamos el número completo ni el CVV."}
            </p>
            <label className="mt-3 block text-sm text-paper/70">
              Fecha de expiración
              <input
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                inputMode="numeric"
                placeholder="MM/AA"
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
              />
            </label>
          </>
        )}

        {kind === "CASH" && (
          <p className="mt-4 text-sm text-paper/55">Pagarás en efectivo cuando te entreguen el pedido.</p>
        )}
        {kind === "WALLET" && (
          <p className="mt-4 text-sm text-paper/55">Usaremos transferencia o billetera al momento del checkout.</p>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-paper/70">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-teal" />
          Guardar como método predeterminado
        </label>

        {error && <p className="mt-3 text-sm text-coral">{error}</p>}

        <button
          type="button"
          onClick={persist}
          className="mt-4 w-full rounded-full bg-teal py-3 text-sm font-medium text-paper hover:bg-teal-light"
        >
          Guardar método
        </button>

        <div className="mt-5 space-y-2 rounded-xl bg-ink p-4 text-sm text-paper/60">
          <p className="font-medium text-paper">Tu pago siempre es seguro</p>
          <p>Pago seguro: no almacenamos el número completo ni el CVV.</p>
          <p>Tus datos están protegidos en este dispositivo.</p>
          <p>Aceptamos Visa, Mastercard, débito, efectivo y transferencia.</p>
        </div>
      </aside>
    </div>
  );
}
