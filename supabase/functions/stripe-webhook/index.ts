import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            status: "paid",
            payment_id: session.payment_intent as string,
          })
          .eq("id", orderId);

        if (error) {
          console.error("Error updating order:", error);
          return new Response(JSON.stringify({ error: "Failed to update order" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`Order ${orderId} updated to paid`);
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const failureMessage = paymentIntent.last_payment_error?.message || "Unknown error";

      // Find order by payment_id
      const { data: orders, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("payment_id", paymentIntent.id)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching order:", fetchError);
      } else if (orders && orders.length > 0) {
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", orders[0].id);

        if (error) {
          console.error("Error updating order to failed:", error);
        } else {
          console.log(`Order ${orders[0].id} marked as failed: ${failureMessage}`);
        }
      } else {
        console.log(`No order found for payment_intent ${paymentIntent.id}`);
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "expired" })
          .eq("id", orderId);

        if (error) {
          console.error("Error updating expired order:", error);
        } else {
          console.log(`Order ${orderId} marked as expired`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
