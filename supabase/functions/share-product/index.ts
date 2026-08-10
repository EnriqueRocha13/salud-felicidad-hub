import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_ORIGIN = "https://saludfelicidad.store";

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
    // Allow Lovable preview domains
    if (url.hostname.endsWith(".lovable.app")) return true;
    return false;
  } catch {
    return false;
  }
}

serve(async (req) => {
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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("id, name, description, price, image_url")
      .eq("id", id)
      .eq("active", true)
      .single();

    if (error || !product) {
      return new Response("Product not found", { status: 404, headers: corsHeaders });
    }

    const redirectUrl = `${origin}/product/${product.id}`;
    const title = `${product.name} — Salud=Felicidad();`;
    const rawDescription =
      product.description?.trim() ||
      `Compra ${product.name} por $${Number(product.price).toFixed(2)} MXN en Salud=Felicidad();`;
    const description = rawDescription.length > 160 ? rawDescription.slice(0, 157) + "..." : rawDescription;
    const imageUrl = product.image_url || `${origin}/placeholder.svg`;
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
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:site_name" content="Salud=Felicidad();" />

  <meta property="product:price:amount" content="${escapeHtml(price)}" />
  <meta property="product:price:currency" content="MXN" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(product.name)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
</head>
<body>
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
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
