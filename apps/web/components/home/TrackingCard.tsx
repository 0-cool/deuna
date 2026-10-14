"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredOrders } from "@/lib/customer-storage";

export function TrackingCard() {
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState("En camino");

  useEffect(() => {
    const active = getStoredOrders().find(
      (order) => order.status !== "DELIVERED" && order.status !== "CANCELLED",
    );
    if (active) {
      setCode(active.code);
      setStatus(active.status === "ON_THE_WAY" ? "En camino" : "Preparando");
    }
  }, []);

  return (
    <aside className="rounded-card border border-ink-border bg-ink-soft p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-paper">Tu pedido en camino</h2>
        {code && (
          <Link href={`/pedido/${code}`} className="text-xs text-teal-light hover:underline">
            Ver {code}
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-teal-light">{status}</p>
      <p className="text-sm text-paper/55">Llegada estimada 18–23 min</p>

      <div className="mt-4 flex justify-between text-[11px] text-paper/45">
        {["Tienda", "En camino", "Casi llega", "Entregado"].map((step, index) => (
          <span key={step} className={index <= 1 ? "text-teal-light" : undefined}>
            {step}
          </span>
        ))}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink">
        <div className="h-full w-1/2 rounded-full bg-teal" />
      </div>

      <div className="relative mt-4 h-40 overflow-hidden rounded-xl border border-ink-border bg-[#0a1628]">
        <svg viewBox="0 0 320 160" className="h-full w-full">
          <path d="M30 120 C80 40, 160 30, 290 50" fill="none" stroke="#0E7C7B" strokeWidth="3" />
          <circle cx="30" cy="120" r="7" fill="#14A5A3" />
          <circle cx="290" cy="50" r="7" fill="#FF5C4D" />
          <text x="40" y="136" fill="#FBFAF7" fontSize="10">
            La Bodega RD
          </text>
          <text x="230" y="38" fill="#FBFAF7" fontSize="10">
            Piantini
          </text>
        </svg>
        <span className="absolute left-[42%] top-[28%] text-lg" aria-hidden>
          🛵
        </span>
      </div>
      <p className="mt-3 text-xs text-paper/45">A unos minutos de tu casa.</p>
    </aside>
  );
}
