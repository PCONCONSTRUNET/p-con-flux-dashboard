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

    // Verify the user is authenticated
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get request body
    const { plan } = await req.json();
    if (!plan || !["monthly", "annual"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get MP access token from platform_settings
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["mp_access_token", "mp_monthly_price", "mp_annual_price"]);

    if (!settings || settings.length === 0) {
      return new Response(JSON.stringify({ error: "Configuração do Mercado Pago não encontrada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const configMap: Record<string, string> = {};
    settings.forEach((s: { key: string; value: string }) => {
      configMap[s.key] = s.value;
    });

    const accessToken = configMap.mp_access_token;
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Access Token do Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const price = plan === "monthly"
      ? parseFloat(configMap.mp_monthly_price || "0")
      : parseFloat(configMap.mp_annual_price || "0");

    if (price <= 0) {
      return new Response(JSON.stringify({ error: "Valor do plano não configurado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for payer info
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    const frequency = plan === "monthly" ? 1 : 12;
    const frequencyType = "months";
    const planTitle = plan === "monthly" ? "P-CON FLUX Mensal" : "P-CON FLUX Anual";

    // Create Mercado Pago preapproval (subscription)
    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: planTitle,
        auto_recurring: {
          frequency: frequency,
          frequency_type: frequencyType,
          transaction_amount: price,
          currency_id: "BRL",
        },
        back_url: `${req.headers.get("origin") || "https://pconflux.lovable.app"}/client`,
        payer_email: profile?.email || user.email,
        external_reference: JSON.stringify({
          user_id: user.id,
          plan: plan,
        }),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP API Error:", mpData);
      return new Response(JSON.stringify({ error: "Erro ao criar assinatura no Mercado Pago", details: mpData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("MP Subscription created:", mpData.id);

    return new Response(
      JSON.stringify({
        checkout_url: mpData.init_point,
        subscription_id: mpData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
