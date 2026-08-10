/** Builds the share URL that renders social/Teams/Zoom-friendly link previews. */
export function getProductShareUrl(productId: string) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/functions/v1/share-product?id=${productId}&origin=${encodeURIComponent(origin)}`;
}

/** Builds the dynamic share image URL for a product. */
export function getProductShareImageUrl(productId: string) {
  const base = import.meta.env.VITE_SUPABASE_URL;
  return `${base}/functions/v1/share-product/image?id=${productId}`;
}

