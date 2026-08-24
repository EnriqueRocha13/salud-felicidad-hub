/** Builds the share URL that renders social/Teams/Zoom-friendly link previews. */
export function getProductShareUrl(productId: string) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/functions/v1/share-product?id=${productId}&origin=${encodeURIComponent(origin)}`;
}

/** Imagen de marca usada como miniatura en todas las redes (Teams, Zoom, WhatsApp, etc.). */
export const BRAND_SHARE_IMAGE_URL =
  "https://saludfelicidad.store/share-brand.png";

/** Builds the share image URL for a product (marca Salud=Felicidad();). */
export function getProductShareImageUrl(_productId?: string) {
  return BRAND_SHARE_IMAGE_URL;
}


