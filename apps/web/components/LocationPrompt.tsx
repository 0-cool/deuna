"use client";

import { useEffect, useState } from "react";
import { LocationSelector } from "./LocationSelector";
import { hasPromptedLocation, markLocationPrompted } from "@/lib/customer-storage";
import { nearestZoneId, setZoneCookie } from "@/lib/zones";

export function LocationPrompt({ currentZoneName }: { currentZoneName: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const alreadyChosen = document.cookie.includes("deuna_zone=");
    if (alreadyChosen || hasPromptedLocation()) return;
    setOpen(true);

    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setZoneCookie(nearestZoneId(coords.lat, coords.lng), coords);
        markLocationPrompted();
        setOpen(false);
        window.location.reload();
      },
      () => {
        // Si el usuario niega el GPS, deja el modal para elegir zona a mano.
      },
    );
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/80 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-card border border-ink-border bg-ink p-5 shadow-2xl">
        <p className="text-sm font-medium text-teal-light">📍 Tu ubicación</p>
        <h2 className="mt-1 font-display text-2xl text-paper">¿Desde dónde pedimos?</h2>
        <p className="mt-2 text-sm text-paper/70">
          La usamos para mostrarte tiendas cercanas, tiempos de entrega y el mapa de tu pedido.
        </p>
        <LocationSelector currentZoneName={currentZoneName} variant="prompt" />
        <button
          type="button"
          onClick={() => {
            markLocationPrompted();
            setOpen(false);
          }}
          className="mt-4 w-full text-sm text-paper/50 hover:text-paper"
        >
          Continuar con {currentZoneName}
        </button>
      </div>
    </div>
  );
}
