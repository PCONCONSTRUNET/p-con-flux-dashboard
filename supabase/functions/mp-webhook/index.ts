import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Plan durations in milliseconds
const PLAN_DURATIONS: Record<string, number> = {
  monthly: 30 * 24 * 60 * 60 * 1000,   // 30 days
  annual: 365 * 24 * 60 * 60 * 1000,    // 365 days
};

async function activateSubscription(
  supabase: any,
  userId: string,
  plan: string,
) {
  const durationMs = PLAN_DURATIONS[plan];
  if (!durationMs) {
    console.error("Unknown plan:", plan);
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMs);

  console.log(`Activating subscription: user=${userId}, plan=${plan}, expires=${expiresAt.toISOString()}`);

  const { error } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: userId,
      plan: plan,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      updated_at: now.toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    console.error("Error activating subscription:", error);
  } else {
    console.log(`Subscription activated for user: ${userId}, plan: ${plan}, expires: ${expiresAt.toISOString()}`);
  }
}

async function getAccessToken(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .eq("key", "mp_access_token")
    .single();
  return data?.value || null;
}

function parseExternalReference(ref: string): { user_id?: string; plan?: string } {
  // New format: "user_id|plan|planTitle"
  if (ref.includes("|")) {
    const [user_id, plan] = ref.split("|");
    return { user_id, plan };
  }
  // Legacy JSON format
  try {
    return JSON.parse(ref);
  } catch {
    console.error("Failed to parse external_reference:", ref);
    return {};
  }
}

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
      // Body may not be JSON for some IPN types
    }

    const notificationType = topic || body?.type || body?.action;
    const resourceId = id || body?.data?.id;

    console.log("MP Webhook received:", { type: notificationType, resourceId });

    // ---- Handle PAYMENT notifications (PIX + single card payments) ----
    if (notificationType === "payment" && resourceId) {
      const accessToken = await getAccessToken(supabase);
      if (!accessToken) {
        console.error("No MP access token configured");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const payment = await paymentRes.json();

      console.log("Payment details:", {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        payment_method: payment.payment_method_id,
        amount: payment.transaction_amount,
        external_reference: payment.external_reference,
      });

      if (payment.status === "approved" && payment.external_reference) {
        const { user_id, plan } = parseExternalReference(payment.external_reference);
        if (user_id && plan) {
          await activateSubscription(supabase, user_id, plan);
        }
      }
    }

    // ---- Handle PREAPPROVAL notifications (recurring card subscriptions) ----
    if (
      notificationType === "subscription_preapproval" ||
      notificationType === "preapproval"
    ) {
      const accessToken = await getAccessToken(supabase);
      if (!accessToken) {
        console.error("No MP access token configured");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch preapproval details
      const preapprovalRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });
      const preapproval = await preapprovalRes.json();

      console.log("Preapproval details:", {
        id: preapproval.id,
        status: preapproval.status,
        reason: preapproval.reason,
        external_reference: preapproval.external_reference,
      });

      if (
        (preapproval.status === "authorized" || preapproval.status === "active") &&
        preapproval.external_reference
      ) {
        const { user_id, plan } = parseExternalReference(preapproval.external_reference);
        if (user_id && plan) {
          await activateSubscription(supabase, user_id, plan);
        }
      }

      // Handle cancellation
      if (preapproval.status === "cancelled" && preapproval.external_reference) {
        const { user_id } = parseExternalReference(preapproval.external_reference);
        if (user_id) {
          await supabase
            .from("subscriptions")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("user_id", user_id);
          console.log("Subscription cancelled for user:", user_id);
        }
      }
    }

    // ---- Handle AUTHORIZED PAYMENT (recurring payment received) ----
    if (notificationType === "subscription_authorized_payment" && resourceId) {
      const accessToken = await getAccessToken(supabase);
      if (accessToken) {
        const paymentRes = await fetch(`https://api.mercadopago.com/authorized_payments/${resourceId}`, {
          headers: { "Authorization": `Bearer ${accessToken}` },
        });
        const authPayment = await paymentRes.json();

        console.log("Authorized payment:", {
          id: authPayment.id,
          status: authPayment.status,
          preapproval_id: authPayment.preapproval_id,
        });

        if (authPayment.status === "approved" && authPayment.preapproval_id) {
          // Fetch the preapproval to get external_reference
          const preapprovalRes = await fetch(`https://api.mercadopago.com/preapproval/${authPayment.preapproval_id}`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
          });
          const preapproval = await preapprovalRes.json();

          if (preapproval.external_reference) {
            const { user_id, plan } = parseExternalReference(preapproval.external_reference);
            if (user_id && plan) {
              await activateSubscription(supabase, user_id, plan);
            }
          }
        }
      }
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
