"use client";

import { useState } from "react";
import { MINIMUM_AGE_DEFAULT } from "@deuna/config";
import { useAgeVerification } from "@/lib/age-verification";

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export function AgeGate() {
  const { modalOpen, status, closeModal, markVerified, markBlocked } = useAgeVerification();
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!modalOpen) return null;

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
      markBlocked();
      return;
    }
    markVerified();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-card border border-ink-border bg-ink-soft p-6 shadow-2xl">
        {status === "blocked" ? (
          <div>
            <p className="text-sm font-medium text-coral">Contenido +{MINIMUM_AGE_DEFAULT}</p>
            <h2 className="mt-2 font-display text-2xl text-paper">
              No podemos mostrarte estas imágenes
            </h2>
            <p className="mt-2 text-sm text-paper/70">
              Confirmaste que eres menor de {MINIMUM_AGE_DEFAULT} años. Puedes seguir navegando
              y comprar productos sin restricción, pero el contenido +{MINIMUM_AGE_DEFAULT}{" "}
              permanecerá oculto.
            </p>
            <button
              type="button"
              onClick={closeModal}
              className="mt-5 w-full rounded-lg bg-teal px-4 py-3 font-medium text-paper transition hover:bg-teal-light"
            >
              Seguir explorando
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-sm font-medium text-teal-light">🔞 Verificación de edad</p>
            <h2 className="mt-2 font-display text-2xl text-paper">
              Este contenido es para mayores de {MINIMUM_AGE_DEFAULT} años
            </h2>
            <p className="mt-2 text-sm text-paper/70">
              Ingresa tu fecha de nacimiento para ver las fotos. No guardamos tu fecha exacta,
              solo confirmamos que cumples la edad mínima. Puedes omitirlo y seguir navegando.
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
              Confirmar y ver contenido
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="mt-3 w-full text-sm text-paper/50 hover:text-paper"
            >
              Ahora no, seguir explorando
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
