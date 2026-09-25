"use client";

import { useMemo, useState } from "react";
import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";
import type { SavedLocation } from "@deuna/types";
import { getSavedLocations, removeLocation, saveLocation } from "@/lib/customer-storage";
import { ZONE_REFERENCE_POINTS } from "@/lib/zones";

const ADDRESS_TYPES = [
  { id: "Casa", icon: "🏠" },
  { id: "Trabajo", icon: "🏢" },
  { id: "Familiar", icon: "👨‍👩‍👧" },
  { id: "Otro", icon: "📍" },
] as const;

function coordsFor(location: Pick<SavedLocation, "lat" | "lng" | "zoneId">) {
  if (location.lat != null && location.lng != null) {
    return { lat: location.lat, lng: location.lng };
  }
  return ZONE_REFERENCE_POINTS[location.zoneId] ?? ZONE_REFERENCE_POINTS.dn!;
}

function MapPreview({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
  const delta = 0.01;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  return <iframe title={title} src={src} className="h-full w-full border-0 grayscale-[20%]" loading="lazy" />;
}

function mergeLocations(current: SavedLocation[], stored: SavedLocation[]) {
  const byId = new Map<string, SavedLocation>();
  for (const location of current) byId.set(location.id, location);
  for (const location of stored) byId.set(location.id, location);
  return Array.from(byId.values());
}

function typeFromLabel(label: string) {
  const match = ADDRESS_TYPES.find((item) => item.id.toLowerCase() === label.trim().toLowerCase());
  return match?.id ?? "Otro";
}

export function ProfileAddresses({
  locations,
  onChange,
}: {
  locations: SavedLocation[];
  onChange: (next: SavedLocation[]) => void;
}) {
  const [formOpen, setFormOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addressType, setAddressType] = useState<(typeof ADDRESS_TYPES)[number]["id"]>("Casa");
  const [customLabel, setCustomLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [reference, setReference] = useState("");
  const [zoneId, setZoneId] = useState(DEFAULT_DELIVERY_ZONES[0]?.id ?? "dn");
  const [isDefault, setIsDefault] = useState(locations.length === 0);

  const preview = useMemo(() => coordsFor({ lat: null, lng: null, zoneId }), [zoneId]);
  const labelValue = addressType === "Otro" ? customLabel.trim() || "Otro" : addressType;

  function resetForm() {
    setEditingId(null);
    setAddressType("Casa");
    setCustomLabel("");
    setLine1("");
    setReference("");
    setZoneId(DEFAULT_DELIVERY_ZONES[0]?.id ?? "dn");
    setIsDefault(locations.length === 0);
    setFormOpen(true);
  }

  function startEdit(location: SavedLocation) {
    setEditingId(location.id);
    setAddressType(typeFromLabel(location.label));
    setCustomLabel(typeFromLabel(location.label) === "Otro" ? location.label : "");
    setLine1(location.line1);
    setReference(location.reference ?? "");
    setZoneId(location.zoneId);
    setIsDefault(location.isDefault);
    setFormOpen(true);
  }

  function persist() {
    if (!line1.trim()) return;
    const point = coordsFor({ lat: null, lng: null, zoneId });
    const next: SavedLocation = {
      id:
        editingId ??
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `loc-${Date.now()}`),
      label: labelValue,
      line1: line1.trim(),
      reference: reference.trim() || null,
      city: "Santo Domingo",
      zoneId,
      lat: point.lat,
      lng: point.lng,
      isDefault: isDefault || locations.length === 0,
    };
    saveLocation(next);
    onChange(mergeLocations(locations, getSavedLocations()));
    resetForm();
  }

  function drop(id: string) {
    removeLocation(id);
    onChange(mergeLocations(locations.filter((item) => item.id !== id), getSavedLocations()));
    if (editingId === id) resetForm();
  }

  function makeDefault(location: SavedLocation) {
    saveLocation({ ...location, isDefault: true });
    onChange(mergeLocations(locations, getSavedLocations()));
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-paper">Mis direcciones</h1>
            <p className="mt-1 text-sm text-paper/55">
              Administra tus ubicaciones de entrega para recibir tus pedidos más rápido.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light"
          >
            + Agregar nueva dirección
          </button>
        </div>

        {locations.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-ink-border bg-ink-soft p-8 text-center">
            <p className="text-paper/75">Todavía no tienes ubicaciones guardadas.</p>
            <p className="mt-1 text-sm text-paper/45">Agrega casa, trabajo o donde te encontremos más fácil.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {locations.map((location) => {
              const point = coordsFor(location);
              return (
                <li
                  key={location.id}
                  className={`overflow-hidden rounded-card border bg-ink-soft ${
                    location.isDefault ? "border-teal" : "border-ink-border"
                  }`}
                >
                  <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="h-36 bg-ink sm:h-auto">
                      <MapPreview lat={point.lat} lng={point.lng} title={`Mapa de ${location.label}`} />
                    </div>
                    <div className="flex flex-col justify-between p-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {location.isDefault && (
                            <span className="rounded-full bg-teal/15 px-2 py-0.5 text-[11px] font-medium text-teal-light">
                              Dirección principal
                            </span>
                          )}
                          <p className="font-medium text-paper">{location.label}</p>
                        </div>
                        <p className="mt-2 text-sm text-paper/75">{location.line1}</p>
                        <p className="text-sm text-paper/50">
                          {location.city}, {DEFAULT_DELIVERY_ZONES.find((zone) => zone.id === location.zoneId)?.name ?? "RD"}
                        </p>
                        {location.reference && (
                          <p className="mt-1 text-sm text-paper/45">Referencia: {location.reference}</p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(location)}
                          className="rounded-full border border-ink-border px-3 py-1.5 text-sm text-paper hover:border-teal"
                        >
                          Editar
                        </button>
                        {!location.isDefault && (
                          <button
                            type="button"
                            onClick={() => makeDefault(location)}
                            className="rounded-full border border-ink-border px-3 py-1.5 text-sm text-paper/70 hover:border-teal"
                          >
                            Hacer principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => drop(location.id)}
                          className="rounded-full px-3 py-1.5 text-sm text-paper/40 hover:text-coral"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className={`rounded-card border border-ink-border bg-ink-soft p-5 lg:sticky lg:top-24 ${formOpen ? "block" : "hidden lg:block"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl text-paper">
              {editingId ? "Editar dirección" : "Agregar nueva dirección"}
            </p>
            <p className="mt-1 text-sm text-paper/50">La usaremos para delivery y para el pin del header.</p>
          </div>
          <button type="button" onClick={() => setFormOpen(false)} className="text-paper/40 hover:text-paper lg:hidden">
            Cerrar
          </button>
        </div>

        <p className="mt-5 text-sm font-medium text-paper">Tipo de dirección</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ADDRESS_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAddressType(item.id)}
              className={`rounded-xl border px-2 py-3 text-center text-xs ${
                addressType === item.id
                  ? "border-teal bg-teal/15 text-teal-light"
                  : "border-ink-border bg-ink text-paper/70"
              }`}
            >
              <span className="block text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.id}
            </button>
          ))}
        </div>
        {addressType === "Otro" && (
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Nombre de esta ubicación"
            className="mt-3 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
          />
        )}

        <label className="mt-4 block text-sm text-paper/70">
          Dirección completa
          <input
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="Busca una dirección o ingrésala manualmente"
            className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-paper/70">
            Ciudad
            <input
              value="Santo Domingo"
              readOnly
              className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper/70"
            />
          </label>
          <label className="text-sm text-paper/70">
            Sector / Ensanche
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper"
            >
              {DEFAULT_DELIVERY_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block text-sm text-paper/70">
          Referencia (opcional)
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ej. torre 2, apartamento 5B"
            className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="mt-3 flex items-center gap-2 text-sm text-paper/70">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-teal" />
          Usar como dirección principal
        </label>

        <div className="mt-4 h-40 overflow-hidden rounded-xl border border-ink-border">
          <MapPreview lat={preview.lat} lng={preview.lng} title="Vista previa del sector" />
        </div>

        <button
          type="button"
          onClick={persist}
          className="mt-4 w-full rounded-full bg-teal py-3 text-sm font-medium text-paper hover:bg-teal-light"
        >
          {editingId ? "Guardar cambios" : "Guardar dirección"}
        </button>
      </aside>
    </div>
  );
}
