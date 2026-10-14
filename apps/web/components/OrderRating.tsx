"use client";

import { useState } from "react";
import type { OrderRating } from "@deuna/types";
import { setOrderRating } from "@/lib/customer-storage";

function Stars({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-sm text-paper/70">{label}</p>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={star <= value ? "text-2xl text-gold" : "text-2xl text-paper/25"}
            aria-label={`${star} estrellas`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function OrderRatingForm({
  code,
  existing,
  onSaved,
}: {
  code: string;
  existing: OrderRating | null;
  onSaved: (rating: OrderRating) => void;
}) {
  const [orderStars, setOrderStars] = useState(existing?.orderStars ?? 5);
  const [driverStars, setDriverStars] = useState(existing?.driverStars ?? 5);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saved, setSaved] = useState(Boolean(existing));

  if (saved && existing) {
    return (
      <div className="rounded-card border border-teal/40 bg-teal/10 p-5">
        <p className="font-medium text-paper">Gracias por tu calificación</p>
        <p className="mt-1 text-sm text-paper/70">
          Pedido {existing.orderStars}/5 · Delivery {existing.driverStars}/5
        </p>
        {existing.comment && <p className="mt-2 text-sm text-paper/60">“{existing.comment}”</p>}
      </div>
    );
  }

  return (
    <form
      className="rounded-card border border-ink-border bg-ink-soft p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const rating: OrderRating = {
          orderStars,
          driverStars,
          comment: comment.trim(),
          at: new Date().toISOString(),
        };
        setOrderRating(code, rating);
        setSaved(true);
        onSaved(rating);
      }}
    >
      <p className="font-display text-xl text-paper">¿Cómo te fue?</p>
      <p className="mt-1 text-sm text-paper/60">Califica cómo recibiste el pedido y al delivery.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Stars value={orderStars} onChange={setOrderStars} label="Cómo recibiste el pedido" />
        <Stars value={driverStars} onChange={setDriverStars} label="Calificar al delivery" />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional"
        className="mt-4 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
        rows={3}
      />
      <button type="submit" className="mt-4 rounded-full bg-teal px-5 py-2 text-sm font-medium text-paper">
        Enviar calificación
      </button>
    </form>
  );
}
