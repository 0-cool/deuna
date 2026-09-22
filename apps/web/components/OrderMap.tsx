"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OrderStatus } from "@deuna/types";

// Mapa real con OpenStreetMap (tiles gratis, sin API key) + OSRM (servidor demo público de
// ruteo, gratis, sin API key, CORS abierto — no apto para producción de alto tráfico, pero
// perfecto para este MVP). Si el ruteo falla o no hay red, se cae a una línea recta entre
// pickup y dropoff en vez de romper el mapa.
//
// Usa la API imperativa de Leaflet directo en vez de `react-leaflet`: esa librería tiene un bug
// conocido ("Map container is already initialized") al combinarse con React 18 StrictMode + Fast
// Refresh de Next.js — su <MapContainer> crea el mapa dentro de un ref callback que no queda a
// salvo de un remount con el mismo nodo del DOM. Aquí lo controlamos a mano con una guardia
// explícita (`mapRef.current` ya existe → no reinicializar) que es inmune a ese problema.

type MapPoint = { lat: number; lng: number; label: string; address: string };
type LatLngTuple = [number, number];

interface OSRMResponse {
  routes?: { geometry?: { coordinates?: [number, number][] } }[];
}

// Progreso aproximado del driver a lo largo de la ruta según el estado simulado del pedido (ver
// OrderTrackingClient) — no es GPS real todavía, pero da una sensación de movimiento coherente
// con el stepper de abajo.
const DRIVER_PROGRESS: Partial<Record<OrderStatus, number>> = {
  DRIVER_ASSIGNED: 0.05,
  PICKED_UP: 0.15,
  ON_THE_WAY: 0.65,
  DELIVERED: 1,
};

function emojiIcon(emoji: string, size = 30) {
  return L.divIcon({
    html: `<div style="font-size:${Math.round(size * 0.6)}px;line-height:${size}px;text-align:center">${emoji}</div>`,
    className: "deuna-map-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function interpolate(route: LatLngTuple[], fraction: number): LatLngTuple {
  if (route.length === 0) return [0, 0];
  if (route.length === 1) return route[0]!;
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const totalSegments = route.length - 1;
  const scaledPosition = clamped * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaledPosition), totalSegments - 1);
  const segmentFraction = scaledPosition - segmentIndex;
  const [lat1, lng1] = route[segmentIndex]!;
  const [lat2, lng2] = route[segmentIndex + 1]!;
  return [lat1 + (lat2 - lat1) * segmentFraction, lng1 + (lng2 - lng1) * segmentFraction];
}

export function OrderMap({
  pickup,
  dropoff,
  currentStatus,
}: {
  pickup: MapPoint;
  dropoff: MapPoint;
  currentStatus: OrderStatus;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeRef = useRef<LatLngTuple[]>([
    [pickup.lat, pickup.lng],
    [dropoff.lat, dropoff.lng],
  ]);
  const statusRef = useRef(currentStatus);
  statusRef.current = currentStatus;

  function syncDriverMarker() {
    const map = mapRef.current;
    if (!map) return;
    const progress = DRIVER_PROGRESS[statusRef.current];
    if (progress === undefined) {
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      return;
    }
    const position = interpolate(routeRef.current, progress);
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(position, { icon: emojiIcon("🛵", 34) }).addTo(map);
    } else {
      driverMarkerRef.current.setLatLng(position);
    }
  }

  // Inicializa el mapa una sola vez por instancia montada.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Defensivo: si Fast Refresh dejó un `_leaflet_id` huérfano en este nodo de una instancia
    // anterior que no llegó a limpiarse, lo borramos antes de inicializar.
    delete (containerRef.current as unknown as { _leaflet_id?: number })._leaflet_id;

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [pickup.lat, pickup.lng],
      13,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([pickup.lat, pickup.lng], { icon: emojiIcon("🏪") }).addTo(map);
    L.marker([dropoff.lat, dropoff.lng], { icon: emojiIcon("📍") }).addTo(map);
    routeLayerRef.current = L.polyline(routeRef.current, {
      color: "#14A5A3",
      weight: 4,
      opacity: 0.8,
    }).addTo(map);
    map.fitBounds(
      [
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ],
      { padding: [32, 32] },
    );

    mapRef.current = map;
    syncDriverMarker();

    return () => {
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      driverMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trae la ruta real por calles (OSRM) una sola vez por par pickup/dropoff. Si falla, se queda
  // la línea recta ya dibujada como fallback.
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    async function loadRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const data: OSRMResponse = await res.json();
        const coords = data.routes?.[0]?.geometry?.coordinates;
        if (coords && coords.length > 1) {
          const latLngs: LatLngTuple[] = coords.map(([lng, lat]) => [lat, lng]);
          routeRef.current = latLngs;
          routeLayerRef.current?.setLatLngs(latLngs);
          syncDriverMarker();
        }
      } catch {
        // Sin conexión al servicio de ruteo gratuito (OSRM demo) o timeout — nos quedamos con la
        // línea recta ya dibujada.
      } finally {
        clearTimeout(timeout);
      }
    }

    loadRoute();
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  // Mueve/crea/quita el marcador del driver cuando avanza el estado simulado.
  useEffect(() => {
    syncDriverMarker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus]);

  return <div ref={containerRef} className="h-72 w-full" />;
}
