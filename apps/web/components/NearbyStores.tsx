import Link from "next/link";
import type { NearbyMerchant } from "@deuna/types";
import { formatDOP } from "@deuna/utils";

export function MerchantGrid({ merchants }: { merchants: NearbyMerchant[] }) {
  if (merchants.length === 0) {
    return <p className="text-paper/60">No hay tiendas disponibles en tu zona todavía.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {merchants.map((m) => (
        <Link
          key={m.id}
          href={`/tiendas/${m.slug}`}
          className="rounded-card border border-ink-border bg-ink-soft p-4 transition hover:border-teal"
        >
          <div className="flex items-center justify-between">
            <p className="font-medium text-paper">{m.name}</p>
            <span
              className={
                m.isOpen
                  ? "rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal-light"
                  : "rounded-full bg-paper/10 px-2 py-0.5 text-xs font-medium text-paper/50"
              }
            >
              {m.isOpen ? "Abierto" : "Cerrado"}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-paper/70">
            <span aria-hidden>⭐</span>
            <span>{m.rating.toFixed(1)}</span>
            <span className="mx-1">·</span>
            <span>{m.distanceKm.toFixed(1)} km</span>
          </div>
          <p className="mt-2 text-sm text-paper/60">
            Entrega {m.etaMinutes - 10}–{m.etaMinutes + 5} min · Delivery {formatDOP(m.deliveryFee)}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function NearbyStores({ merchants }: { merchants: NearbyMerchant[] }) {
  if (merchants.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-paper">Cerca de ti</h2>
        <Link href="/tiendas" className="text-sm text-teal-light hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="mt-5">
        <MerchantGrid merchants={merchants} />
      </div>
    </section>
  );
}
