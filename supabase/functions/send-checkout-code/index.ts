import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    const claims = claimsData?.claims;
    if (claimsError || !claims?.sub || !claims?.email) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claims.sub as string;
    const email = claims.email as string;

    // Rate limit: max 3 codes per 10 minutes
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("checkout_verification_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", tenMinAgo);
    if ((count ?? 0) >= 3) {
      return json({ error: "too_many_requests" }, 429);
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await admin
      .from("checkout_verification_codes")
      .insert({ user_id: userId, code, expires_at: expiresAt });
    if (insertError) {
      console.error("Insert error:", insertError.message);
      return json({ error: "server_error" }, 500);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return json({ error: "email_unavailable" }, 500);
    }

    const html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <div style="background:#2ecc71;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:22px">Código de verificación</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p style="color:#374151;font-size:15px;line-height:1.6">Usa este código para confirmar tu compra en Salud=Felicidad();</p>
          <p style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;margin:24px 0;color:#2ecc71">${code}</p>
          <p style="color:#9ca3af;font-size:13px">El código expira en 10 minutos. Si no solicitaste este código, ignora este correo.</p>
        </div>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Salud y Felicidad <ventas@saludfelicidad.store>",
        to: [email],
        subject: "Tu código de verificación - Salud=Felicidad();",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error (${res.status}):`, err);
      return json({ error: "email_failed" }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "server_error" }, 500);
  }
});
