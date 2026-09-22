// packages/config
//
// Estos son los valores POR DEFECTO usados en desarrollo y en el seed. En producción, Admin
// los lee/escribe desde la base de datos (tablas Commission, DeliveryZone, CategoryRule) —
// nada de esto debe quedar hardcodeado en el código de negocio real.
//
// ⚠️ LEGAL REVIEW REQUIRED: las categorías marcadas con requiresAgeVerification=true y sus
// reglas de verificación deben confirmarse con asesoría legal dominicana antes de operar.
// Los valores aquí son un punto de partida razonable, no una determinación legal.

import type { CommissionConfig, DeliveryZoneConfig } from "@deuna/types";

export const DEFAULT_COMMISSION: CommissionConfig = {
  merchantCommissionPercent: 15,
  serviceFeeFixed: 0,
  serviceFeePercent: 2.5,
};

export const DEFAULT_DELIVERY_ZONES: DeliveryZoneConfig[] = [
  { id: "dn", name: "Distrito Nacional", baseFee: 100, pricePerKm: 15, estimatedMinutes: 25 },
  { id: "sde", name: "Santo Domingo Este", baseFee: 150, pricePerKm: 18, estimatedMinutes: 35 },
  { id: "sdo", name: "Santo Domingo Oeste", baseFee: 175, pricePerKm: 18, estimatedMinutes: 35 },
  { id: "sdn", name: "Santo Domingo Norte", baseFee: 175, pricePerKm: 18, estimatedMinutes: 40 },
];

export const CATEGORY_SLUGS = [
  "cervezas",
  "ron",
  "whisky",
  "vodka",
  "tequila",
  "vinos",
  "espumantes",
  "tabaco",
  "vape",
  "hielo",
  "mixers",
  "snacks",
  "fiestas",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

interface CategoryRule {
  slug: CategorySlug;
  label: string;
  emoji: string;
  requiresAgeVerification: boolean;
}

// requiresAgeVerification por categoría — configurable, no un `if` disperso en el código.
export const CATEGORY_RULES: Record<CategorySlug, CategoryRule> = {
  cervezas: { slug: "cervezas", label: "Cervezas", emoji: "🍺", requiresAgeVerification: true },
  ron: { slug: "ron", label: "Ron", emoji: "🥃", requiresAgeVerification: true },
  whisky: { slug: "whisky", label: "Whisky", emoji: "🥃", requiresAgeVerification: true },
  vodka: { slug: "vodka", label: "Vodka", emoji: "🍸", requiresAgeVerification: true },
  tequila: { slug: "tequila", label: "Tequila", emoji: "🍸", requiresAgeVerification: true },
  vinos: { slug: "vinos", label: "Vinos", emoji: "🍷", requiresAgeVerification: true },
  espumantes: { slug: "espumantes", label: "Espumantes", emoji: "🍾", requiresAgeVerification: true },
  tabaco: { slug: "tabaco", label: "Tabaco", emoji: "🚬", requiresAgeVerification: true },
  vape: { slug: "vape", label: "Vape", emoji: "💨", requiresAgeVerification: true },
  hielo: { slug: "hielo", label: "Hielo", emoji: "🧊", requiresAgeVerification: false },
  mixers: { slug: "mixers", label: "Mixers", emoji: "🥤", requiresAgeVerification: false },
  snacks: { slug: "snacks", label: "Snacks", emoji: "🥜", requiresAgeVerification: false },
  fiestas: { slug: "fiestas", label: "Para fiestas", emoji: "🎉", requiresAgeVerification: false },
};

export const MINIMUM_AGE_DEFAULT = 18; // ⚠️ LEGAL REVIEW REQUIRED antes de asumir este valor.
