"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";

export function LocationSelector({ currentZoneName }: { currentZoneName: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function selectZone(zoneId: string) {
    document.cookie = `deuna_zone=${zoneId}; path=/; max-age=${60 * 60 * 24 * 90}`;
    setOpen(false);
    router.refresh();
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setOpen(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        // MVP: no hay geocoding inverso todavía (sección 27, MapProvider futuro), así que
        // por ahora confirmamos con la zona más cercana disponible en vez de coordenadas
        // exactas. La UI ya no obliga a compartir GPS si el usuario prefiere elegir zona.
        selectZone(DEFAULT_DELIVERY_ZONES[0]?.id ?? "dn");
      },
      () => setOpen(false)
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-ink-border bg-ink-soft px-3 py-1.5 text-sm text-paper/90 transition hover:border-teal"
      >
        <span aria-hidden>📍</span>
        <span className="max-w-[9rem] truncate">{currentZoneName}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-card border border-ink-border bg-ink-soft p-4 shadow-2xl">
          <p className="font-display text-lg text-paper">¿Dónde quieres recibir tu pedido?</p>
          <button
            onClick={useMyLocation}
            className="mt-3 w-full rounded-lg bg-teal px-3 py-2 text-left text-sm font-medium text-paper hover:bg-teal-light"
          >
            Usar mi ubicación
          </button>
          <p className="mt-4 text-xs uppercase tracking-wide text-paper/50">O elige tu zona</p>
          <div className="mt-2 flex flex-col gap-1">
            {DEFAULT_DELIVERY_ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() => selectZone(zone.id)}
                className="rounded-lg px-3 py-2 text-left text-sm text-paper/90 hover:bg-ink"
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
