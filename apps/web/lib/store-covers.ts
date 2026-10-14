export const STORE_COVERS: Record<string, string> = {
  "deuna-liquor": "/hero-banner.jpg",
  "santo-domingo-drinks": "/login-banner.jpg",
  "zona-drink": "/register-banner.jpg",
  "la-bodega-rd": "/register-banner.jpg",
  "bottle-house": "/login-banner.jpg",
};

export const DEFAULT_STORE_COVER = "/hero-banner.jpg";

export function storeCover(slug: string) {
  return STORE_COVERS[slug] ?? DEFAULT_STORE_COVER;
}
