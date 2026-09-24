"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";
import { getSavedLocations, markLocationPrompted, saveLocation } from "@/lib/customer-storage";
import { nearestZoneId, setZoneCookie } from "@/lib/zones";
import type { SavedLocation } from "@deuna/types";

export function LocationSelector({
  currentZoneName,
  variant = "nav",
}: {
  currentZoneName: string;
  variant?: "nav" | "prompt";
}) {
  const [open, setOpen] = useState(variant === "prompt");
  const [saved, setSaved] = useState<SavedLocation[]>([]);
  const router = useRouter();

  useEffect(() => {
    setSaved(getSavedLocations());
  }, [open]);

  function selectZone(zoneId: string, coords?: { lat: number; lng: number }) {
    setZoneCookie(zoneId, coords);
    markLocationPrompted();
    setOpen(false);
    router.refresh();
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      selectZone(DEFAULT_DELIVERY_ZONES[0]?.id ?? "dn");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        selectZone(nearestZoneId(coords.lat, coords.lng), coords);
      },
      () => selectZone(DEFAULT_DELIVERY_ZONES[0]?.id ?? "dn"),
    );
  }

  function useSaved(location: SavedLocation) {
    const coords =
      location.lat != null && location.lng != null
        ? { lat: location.lat, lng: location.lng }
        : undefined;
    selectZone(location.zoneId, coords);
  }

  function persistCurrentAsSaved() {
    const label = window.prompt("Nombre de esta ubicación", "Casa");
    if (!label) return;
    saveLocation({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `loc-${Date.now()}`,
      label,
      line1: currentZoneName,
      reference: null,
      city: "Santo Domingo",
      zoneId: DEFAULT_DELIVERY_ZONES.find((zone) => zone.name === currentZoneName)?.id ?? "dn",
      lat: null,
      lng: null,
      isDefault: saved.length === 0,
    });
    setSaved(getSavedLocations());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-teal/40 bg-ink-soft px-3 py-1.5 text-sm text-paper transition hover:border-teal"
        aria-label="Cambiar ubicación"
        title="Cambiar ubicación"
      >
        <span aria-hidden className="text-base">
          📍
        </span>
        <span className="max-w-[8rem] truncate sm:max-w-[12rem]">{currentZoneName}</span>
        <span className="hidden text-xs text-teal-light sm:inline">Cambiar</span>
      </button>

      {open && (
        <div
          className={
            variant === "prompt"
              ? "relative z-40 mt-3 w-full rounded-card border border-ink-border bg-ink-soft p-4 shadow-2xl"
              : "absolute left-0 top-full z-40 mt-2 w-80 rounded-card border border-ink-border bg-ink-soft p-4 shadow-2xl"
          }
        >
          <p className="font-display text-lg text-paper">¿Dónde quieres recibir tu pedido?</p>
          <button
            type="button"
            onClick={useMyLocation}
            className="mt-3 w-full rounded-lg bg-teal px-3 py-2 text-left text-sm font-medium text-paper hover:bg-teal-light"
          >
            Usar mi ubicación
          </button>
          {saved.length > 0 && (
            <>
              <p className="mt-4 text-xs uppercase tracking-wide text-paper/50">Ubicaciones guardadas</p>
              <div className="mt-2 flex flex-col gap-1">
                {saved.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => useSaved(location)}
                    className="rounded-lg px-3 py-2 text-left text-sm text-paper/90 hover:bg-ink"
                  >
                    {location.label} · {location.line1}
                  </button>
                ))}
              </div>
            </>
          )}
          <p className="mt-4 text-xs uppercase tracking-wide text-paper/50">O elige tu zona</p>
          <div className="mt-2 flex flex-col gap-1">
            {DEFAULT_DELIVERY_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => selectZone(zone.id)}
                className="rounded-lg px-3 py-2 text-left text-sm text-paper/90 hover:bg-ink"
              >
                {zone.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={persistCurrentAsSaved}
            className="mt-3 text-xs text-teal-light hover:underline"
          >
            Guardar ubicación actual
          </button>
        </div>
      )}
    </div>
  );
}
