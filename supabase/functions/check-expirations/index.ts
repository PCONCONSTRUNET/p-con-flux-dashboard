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

    const now = new Date().toISOString();

    // Find all active subscriptions that have expired
    const { data: expired, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id, user_id, plan, expires_at")
      .eq("is_active", true)
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Error fetching expired subscriptions:", fetchError);
      return new Response(JSON.stringify({ error: "Fetch error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expired || expired.length === 0) {
      console.log("No expired subscriptions found at", now);
      return new Response(JSON.stringify({ deactivated: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${expired.length} expired subscription(s) to deactivate`);

    // Deactivate each expired subscription
    const expiredIds = expired.map((s: any) => s.id);
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        is_active: false,
        plan: "trial",
        updated_at: now,
      })
      .in("id", expiredIds);

    if (updateError) {
      console.error("Error deactivating subscriptions:", updateError);
      return new Response(JSON.stringify({ error: "Update error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log each deactivation
    expired.forEach((s: any) => {
      console.log(`Deactivated: user=${s.user_id}, plan=${s.plan}, expired_at=${s.expires_at}`);
    });

    return new Response(
      JSON.stringify({
        deactivated: expired.length,
        users: expired.map((s: any) => s.user_id),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Check-expirations error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
