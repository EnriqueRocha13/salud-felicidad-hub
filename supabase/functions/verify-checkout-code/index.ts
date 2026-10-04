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
    if (claimsError || !claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claims.sub as string;

    let body: { code?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!/^\d{6}$/.test(code)) {
      return json({ error: "invalid_code" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: rows, error: selectError } = await admin
      .from("checkout_verification_codes")
      .select("id, expires_at, used, attempts")
      .eq("user_id", userId)
      .eq("code", code)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selectError) {
      console.error("Select error:", selectError.message);
      return json({ error: "server_error" }, 500);
    }

    const row = rows?.[0];
    if (!row || row.used || new Date(row.expires_at).getTime() < Date.now()) {
      return json({ error: "invalid_code" }, 400);
    }
    if ((row.attempts ?? 0) >= 5) {
      return json({ error: "too_many_attempts" }, 429);
    }

    const { error: updateError } = await admin
      .from("checkout_verification_codes")
      .update({ used: true })
      .eq("id", row.id);
    if (updateError) {
      console.error("Update error:", updateError.message);
      return json({ error: "server_error" }, 500);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "server_error" }, 500);
  }
});
