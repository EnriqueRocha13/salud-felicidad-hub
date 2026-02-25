import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const statusMessages: Record<string, { subject: string; heading: string; body: string; color: string }> = {
  paid: {
    subject: "✅ Tu pago ha sido confirmado",
    heading: "¡Pago confirmado!",
    body: "Tu pedido ha sido procesado exitosamente. Pronto recibirás más información sobre el envío.",
    color: "#22c55e",
  },
  failed: {
    subject: "❌ Tu pago no pudo ser procesado",
    heading: "Pago fallido",
    body: "Lamentablemente no pudimos procesar tu pago. Por favor intenta de nuevo o usa otro método de pago.",
    color: "#ef4444",
  },
  expired: {
    subject: "⏰ Tu sesión de pago ha expirado",
    heading: "Sesión expirada",
    body: "La sesión de pago ha expirado. Puedes volver a intentar realizando un nuevo pedido.",
    color: "#f59e0b",
  },
};

async function sendOrderEmail(email: string, orderId: string, status: string, totalPrice?: number) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.error("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const info = statusMessages[status];
  if (!info) {
    console.log(`No email template for status: ${status}`);
    return;
  }

  const priceHtml = totalPrice != null
    ? `<p style="font-size:18px;font-weight:bold;margin:16px 0">Total: $${Number(totalPrice).toFixed(2)} MXN</p>`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <div style="background:${info.color};color:#fff;padding:16px 24px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:22px">${info.heading}</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="color:#374151;font-size:15px;line-height:1.6">${info.body}</p>
        ${priceHtml}
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">Pedido: ${orderId}</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Salud y Felicidad <ventas@saludfelicidad.store>",
        to: [email],
        subject: info.subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Resend error (${res.status}):`, err);
    } else {
      console.log(`Email sent to ${email} for order ${orderId} (${status})`);
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

async function getUserEmail(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();
  return data?.email ?? null;
}

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

        // Send email notification
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("user_id, total_price")
          .eq("id", orderId)
          .single();

        if (order?.user_id) {
          const email = await getUserEmail(supabaseAdmin, order.user_id);
          if (email) {
            await sendOrderEmail(email, orderId, "paid", order.total_price);
          }
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const failureMessage = paymentIntent.last_payment_error?.message || "Unknown error";

      const { data: orders, error: fetchError } = await supabaseAdmin
        .from("orders")
        .select("id, user_id, total_price")
        .eq("payment_id", paymentIntent.id)
        .limit(1);

      if (fetchError) {
        console.error("Error fetching order:", fetchError);
      } else if (orders && orders.length > 0) {
        const order = orders[0];
        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", order.id);

        if (error) {
          console.error("Error updating order to failed:", error);
        } else {
          console.log(`Order ${order.id} marked as failed: ${failureMessage}`);
          if (order.user_id) {
            const email = await getUserEmail(supabaseAdmin, order.user_id);
            if (email) await sendOrderEmail(email, order.id, "failed", order.total_price);
          }
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

          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("user_id, total_price")
            .eq("id", orderId)
            .single();

          if (order?.user_id) {
            const email = await getUserEmail(supabaseAdmin, order.user_id);
            if (email) await sendOrderEmail(email, orderId, "expired", order.total_price);
          }
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
