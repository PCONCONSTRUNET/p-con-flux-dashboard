import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const id = url.searchParams.get("id") || url.searchParams.get("data.id");

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may not be JSON
    }

    const notificationType = topic || body?.type || body?.action;
    const resourceId = id || body?.data?.id;

    console.log("MP Webhook received:", { type: notificationType, resourceId, body });

    // Handle payment notifications (PIX and card)
    if (notificationType === "payment" && resourceId) {
      // Fetch payment details from MP API
      const { data: settings } = await supabase
        .from("platform_settings")
        .select("key, value")
        .eq("key", "mp_access_token")
        .single();

      if (settings?.value) {
        const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
          headers: { "Authorization": `Bearer ${settings.value}` },
        });
        const payment = await paymentRes.json();
        console.log("Payment details:", payment.id, payment.status, payment.external_reference);

        if (payment.status === "approved" && payment.external_reference) {
          try {
            const ref = JSON.parse(payment.external_reference);
            const userId = ref.user_id;
            const plan = ref.plan;

            if (userId && plan) {
              const now = new Date();
              const expiresAt = plan === "monthly"
                ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

              await supabase
                .from("subscriptions")
                .upsert({
                  user_id: userId,
                  plan: plan,
                  started_at: now.toISOString(),
                  expires_at: expiresAt.toISOString(),
                  is_active: true,
                  updated_at: now.toISOString(),
                }, { onConflict: "user_id" });

              console.log("Subscription activated for user:", userId, "plan:", plan);
            }
          } catch (e) {
            console.error("Error parsing external_reference:", e);
          }
        }
      }
    }

    // Handle subscription (preapproval) notifications
    if (
      notificationType === "subscription_preapproval" ||
      notificationType === "preapproval" ||
      notificationType === "subscription_authorized_payment"
    ) {
      console.log("Subscription event received:", { type: notificationType, id: resourceId, data: body });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
