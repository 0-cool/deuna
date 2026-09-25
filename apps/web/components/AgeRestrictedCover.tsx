"use client";

import { MINIMUM_AGE_DEFAULT } from "@deuna/config";
import { useAgeVerification } from "@/lib/age-verification";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function AgeRestrictedCover({ compact = false }: { compact?: boolean }) {
  const { requestVerification, status } = useAgeVerification();
  const blocked = status === "blocked";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        requestVerification();
      }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#1a1520]/95 px-3 text-center"
      aria-label={
        blocked
          ? `Contenido para mayores de ${MINIMUM_AGE_DEFAULT} años oculto`
          : "Mostrar contenido para mayores de edad"
      }
    >
      <span
        className={`flex items-center justify-center rounded-full border border-paper/20 bg-ink/70 text-paper ${
          compact ? "h-11 w-11" : "h-14 w-14"
        }`}
      >
        <EyeIcon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <span className={`font-medium text-paper ${compact ? "text-xs" : "text-sm"}`}>
        +{MINIMUM_AGE_DEFAULT} Ver producto
      </span>
      <span className={`max-w-[12rem] text-paper/60 ${compact ? "text-[11px] leading-tight" : "text-xs"}`}>
        {blocked ? "Oculto porque no cumples la edad mínima" : "Toca el ojo para ver"}
      </span>
    </button>
  );
}
