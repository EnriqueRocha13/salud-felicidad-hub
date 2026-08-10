import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resvg, initWasm } from "npm:@resvg/resvg-wasm@2.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_ORIGIN = "https://saludfelicidad.store";

const BRAND_GREEN = "#2ECC71";
const BG_LIGHT = "#F8FAFC";
const TEXT_DARK = "#1E293B";
const TEXT_MUTED = "#64748B";

let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const wasm = await Deno.readFile("./resvg.wasm");
  await initWasm(wasm);
  wasmInitialized = true;
}

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) {
      return false;
    }
    const allowedHostnames = [
      "saludfelicidad.store",
      "salud-felicidad-hub.lovable.app",
      "localhost",
    ];
    if (allowedHostnames.includes(url.hostname)) return true;
    if (url.hostname.endsWith(".lovable.app")) return true;
    return false;
  } catch {
    return false;
  }
}

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

async function getProduct(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select("id, name, description, price, image_url")
    .eq("id", id)
    .eq("active", true)
    .single();
  if (error || !product) return null;
  return product;
}

function getImageMimeType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    case "gif":
      return "image/gif";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

async function fetchImageAsDataUri(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length === 0) return null;
    const mime = getImageMimeType(imageUrl);
    const base64 = encodeBase64(bytes);
    return `data:${mime};base64,${base64}`;
  } catch (err) {
    console.error("fetch image error:", err);
    return null;
  }
}

function encodeBase64(data: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let i = 0; i < data.length; i += 3) {
    const a = data[i];
    const b = data[i + 1] ?? 0;
    const c = data[i + 2] ?? 0;
    result += chars[a >> 2];
    result += chars[((a & 0x03) << 4) | (b >> 4)];
    result += i + 1 < data.length ? chars[((b & 0x0f) << 2) | (c >> 6)] : "=";
    result += i + 2 < data.length ? chars[c & 0x3f] : "=";
  }
  return result;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildShareSvg(product: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}, imageDataUri: string | null): string {
  const title = escapeHtml(truncate(product.name, 48));
  const price = `$${Number(product.price).toFixed(2)} MXN`;
  const brand = "Salud=Felicidad();";

  // Image area: 520x520 centered horizontally, below brand header
  const imgX = 340;
  const imgY = 100;
  const imgW = 520;
  const imgH = 420;

  const imageBlock = imageDataUri
    ? `<image href="${imageDataUri}" x="${imgX}" y="${imgY}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid meet" />`
    : `<text x="600" y="${imgY + imgH / 2}" font-family="Roboto, sans-serif" font-size="24" fill="${TEXT_MUTED}" text-anchor="middle">${escapeHtml(product.name)}</text>`;

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG_LIGHT}" />
  <text x="600" y="64" font-family="Roboto, sans-serif" font-size="52" font-weight="bold" fill="${BRAND_GREEN}" text-anchor="middle">${brand}</text>
  <rect x="${imgX - 8}" y="${imgY - 8}" width="${imgW + 16}" height="${imgH + 16}" rx="16" fill="#ffffff" stroke="#E2E8F0" stroke-width="2" />
  ${imageBlock}
  <text x="600" y="580" font-family="Roboto, sans-serif" font-size="36" font-weight="bold" fill="${TEXT_DARK}" text-anchor="middle">${title}</text>
  <text x="600" y="620" font-family="Roboto, sans-serif" font-size="30" font-weight="bold" fill="${BRAND_GREEN}" text-anchor="middle">${price}</text>
</svg>`;
}

async function renderPng(svg: string): Promise<Uint8Array> {
  await ensureWasm();
  const resvg = new Resvg(svg, {
    background: BG_LIGHT,
    font: {
      fontFiles: ["./fonts/Roboto-Bold.ttf"],
      defaultFontFamily: "Roboto",
    },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

async function handleImageRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response("Missing product id", { status: 400, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const product = await getProduct(supabaseAdmin, id);
    if (!product) {
      return new Response("Product not found", { status: 404, headers: corsHeaders });
    }

    const imageDataUri = product.image_url ? await fetchImageAsDataUri(product.image_url) : null;
    const svg = buildShareSvg(product, imageDataUri);
    const png = await renderPng(svg);

    return new Response(png, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Share image error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
}

async function handleHtmlRequest(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const origin = url.searchParams.get("origin") || DEFAULT_ORIGIN;

  if (!id) {
    return new Response("Missing product id", { status: 400, headers: corsHeaders });
  }

  if (!isAllowedOrigin(origin)) {
    return new Response("Invalid origin", { status: 400, headers: corsHeaders });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const product = await getProduct(supabaseAdmin, id);
    if (!product) {
      return new Response("Product not found", { status: 404, headers: corsHeaders });
    }

    const redirectUrl = `${origin}/product/${product.id}`;
    const imageUrl = `${url.origin}/functions/v1/share-product/image?id=${product.id}`;
    const title = `${product.name} — Salud=Felicidad();`;
    const rawDescription =
      product.description?.replace(/\s+/g, " ").trim() ||
      `Compra ${product.name} por $${Number(product.price).toFixed(2)} MXN en Salud=Felicidad();`;
    const description = rawDescription.length > 160 ? rawDescription.slice(0, 157) + "..." : rawDescription;
    const price = Number(product.price).toFixed(2);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(redirectUrl)}" />

  <meta property="og:title" content="${escapeHtml(product.name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(redirectUrl)}" />
  <meta property="og:type" content="product" />
  <meta property="og:locale" content="es_MX" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(product.name)}" />
  <meta property="og:site_name" content="Salud=Felicidad();" />

  <meta property="product:price:amount" content="${escapeHtml(price)}" />
  <meta property="product:price:currency" content="MXN" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(product.name)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(product.name)}" />

  <!-- Microsoft Teams / Zoom / Skype thumbnail hints -->
  <meta name="thumbnail" content="${escapeHtml(imageUrl)}" />
  <meta name="msapplication-TileImage" content="${escapeHtml(imageUrl)}" />
  <link rel="image_src" href="${escapeHtml(imageUrl)}" />
  <meta itemprop="name" content="${escapeHtml(product.name)}" />
  <meta itemprop="description" content="${escapeHtml(description)}" />
  <meta itemprop="image" content="${escapeHtml(imageUrl)}" />
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: [imageUrl],
    url: redirectUrl,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
      url: redirectUrl,
    },
  })}</script>
  <noscript><meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}" /></noscript>
</head>
<body>
  <a href="${escapeHtml(redirectUrl)}"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" width="320" /></a>
  <p>Redirigiendo a ${escapeHtml(product.name)}...</p>
  <script>
    window.location.replace("${escapeHtml(redirectUrl)}");
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Share product error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
}

serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.endsWith("/image")) {
    return await handleImageRequest(req);
  }
  return await handleHtmlRequest(req);
});
