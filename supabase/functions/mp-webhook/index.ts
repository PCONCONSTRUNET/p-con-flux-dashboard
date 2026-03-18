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

    // Mercado Pago sends notifications via POST with query params or JSON body
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

    console.log("MP Webhook received:", {
      type: notificationType,
      resourceId,
      body,
    });

    // Handle subscription (preapproval) notifications
    if (
      notificationType === "subscription_preapproval" ||
      notificationType === "preapproval" ||
      notificationType === "subscription_authorized_payment"
    ) {
      // Log the event for now — full processing requires the access token
      // to call the MP API and get subscription details
      console.log("Subscription event received:", {
        type: notificationType,
        id: resourceId,
        data: body,
      });

      // If we have a preapproval ID, we could fetch details from MP API
      // and update the subscription status in our database
      // This requires the access token stored in config
    }

    // Handle payment notifications
    if (notificationType === "payment") {
      console.log("Payment event received:", {
        id: resourceId,
        data: body,
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
