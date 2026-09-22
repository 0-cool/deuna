"use client";

import { useEffect, useState } from "react";
import { MINIMUM_AGE_DEFAULT } from "@deuna/config";

// Capa 1 de verificación de edad (declarativa, sección 8 del spec): pide fecha de nacimiento
// real y calcula la edad, en vez de un botón "sí/no". No sustituye la verificación en
// checkout ni la confirmación en la entrega — es la primera barrera antes de navegar el
// catálogo. Guarda solo el resultado (verificado sí/no) en localStorage, nunca la fecha
// exacta ni ningún documento.
//
// ⚠️ LEGAL REVIEW REQUIRED: confirmar con asesoría legal dominicana si esta capa por sí sola
// es suficiente o si se requiere un proveedor externo antes de operar con público real.

const STORAGE_KEY = "deuna_age_verified_v1";

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function AgeGate() {
  const [status, setStatus] = useState<"checking" | "verified" | "gate" | "blocked">("checking");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setStatus(stored === "true" ? "verified" : "gate");
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!birthDate) {
      setError("Ingresa tu fecha de nacimiento.");
      return;
    }
    const parsed = new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) {
      setError("Fecha inválida.");
      return;
    }
    const age = calculateAge(parsed);
    if (age < MINIMUM_AGE_DEFAULT) {
      setStatus("blocked");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, "true");
    setStatus("verified");
  }

  if (status === "checking" || status === "verified") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-card border border-ink-border bg-ink-soft p-6 shadow-2xl">
        {status === "gate" && (
          <form onSubmit={handleSubmit}>
            <p className="text-sm font-medium text-teal-light">🔞 Verificación de edad</p>
            <h2 className="mt-2 font-display text-2xl text-paper">
              DeUna vende productos para mayores de edad
            </h2>
            <p className="mt-2 text-sm text-paper/70">
              Ingresa tu fecha de nacimiento para continuar. No guardamos tu fecha exacta, solo
              confirmamos que cumples la edad mínima.
            </p>
            <label className="mt-5 block text-sm text-paper/80">
              Fecha de nacimiento
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2 text-paper outline-none focus:border-teal"
                required
              />
            </label>
            {error && <p className="mt-2 text-sm text-coral">{error}</p>}
            <button
              type="submit"
              className="mt-5 w-full rounded-lg bg-teal px-4 py-3 font-medium text-paper transition hover:bg-teal-light"
            >
              Confirmar y continuar
            </button>
          </form>
        )}
        {status === "blocked" && (
          <div>
            <p className="text-sm font-medium text-coral">Acceso restringido</p>
            <h2 className="mt-2 font-display text-2xl text-paper">
              Lo sentimos, DeUna es solo para mayores de {MINIMUM_AGE_DEFAULT} años
            </h2>
            <p className="mt-2 text-sm text-paper/70">
              No puedes continuar navegando la plataforma en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
