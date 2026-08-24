import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData?.user;
    if (!user?.email) return json({ error: "Unauthorized" }, 401);

    // Validate input
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }
    const orderId = (payload as { orderId?: unknown })?.orderId;
    if (typeof orderId !== "string" || !UUID_RE.test(orderId)) {
      return json({ error: "Invalid orderId" }, 400);
    }

    // Service role client for authoritative reads
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify order ownership and state
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup failed:", orderError);
      return json({ error: "Unable to process payment" }, 500);
    }
    if (!order || order.user_id !== user.id) {
      return json({ error: "Order not found" }, 404);
    }
    if (order.status !== "pending") {
      return json({ error: "Order is not payable" }, 409);
    }

    // Build line items from server-side data only
    const { data: orderItems, error: itemsError } = await admin
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Order items lookup failed:", itemsError);
      return json({ error: "Unable to process payment" }, 500);
    }
    if (!orderItems || orderItems.length === 0) {
      return json({ error: "Order has no items" }, 400);
    }

    const productIds = [...new Set(orderItems.map((i) => i.product_id).filter(Boolean))] as string[];
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, price, active")
      .in("id", productIds);

    if (productsError) {
      console.error("Product lookup failed:", productsError);
      return json({ error: "Unable to process payment" }, 500);
    }

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let serverTotal = 0;

    for (const item of orderItems) {
      const product = item.product_id ? productMap.get(item.product_id) : undefined;
      if (!product || product.active !== true) {
        return json({ error: "One or more products are unavailable" }, 400);
      }
      const quantity = Math.floor(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 999) {
        return json({ error: "Invalid item quantity" }, 400);
      }
      const unitAmount = Math.round(Number(product.price) * 100);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        return json({ error: "Invalid product price" }, 400);
      }
      serverTotal += (unitAmount * quantity) / 100;
      lineItems.push({
        price_data: {
          currency: "mxn",
          product_data: { name: product.name },
          unit_amount: unitAmount,
        },
        quantity,
      });
    }

    // Recompute authoritative amounts stored on the order


    for (const item of orderItems) {
      const product = productMap.get(item.product_id as string)!;
      await admin
        .from("order_items")
        .update({ price_at_order: Number(product.price), product_name: product.name })
        .eq("order_id", orderId)
        .eq("product_id", item.product_id as string);
    }

    await admin
      .from("orders")
      .update({ total_price: Number(serverTotal.toFixed(2)) })
      .eq("id", orderId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://salud-felicidad-hub.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?order_id=${orderId}`,
      cancel_url: `${origin}/checkout`,
      metadata: { order_id: orderId, user_id: user.id },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return json({ error: "Unable to process payment" }, 500);
  }
});
