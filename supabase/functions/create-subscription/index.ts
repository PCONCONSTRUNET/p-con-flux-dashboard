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

    // Verify user
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

    const body = await req.json();
    const { plan, card_token, email, doc_number } = body;

    if (!plan || !["monthly", "annual"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get MP config
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
      return new Response(JSON.stringify({ error: "Access Token não configurado" }), {
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

    const frequency = plan === "monthly" ? 1 : 12;
    const planTitle = plan === "monthly" ? "P-CON FLUX Mensal" : "P-CON FLUX Anual";
    const payerEmail = email || user.email;

    // If card_token provided, create preapproval with card
    if (card_token) {
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
            frequency_type: "months",
            transaction_amount: price,
            currency_id: "BRL",
          },
          back_url: `${req.headers.get("origin") || "https://pconflux.lovable.app"}/client`,
          payer_email: payerEmail,
          card_token_id: card_token,
          external_reference: JSON.stringify({
            user_id: user.id,
            plan: plan,
          }),
          notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
          status: "authorized",
        }),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("MP API Error:", JSON.stringify(mpData));
        const errorMsg = mpData?.message || mpData?.cause?.[0]?.description || "Erro ao processar pagamento";
        return new Response(JSON.stringify({ error: errorMsg, details: mpData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("MP Subscription created with card:", mpData.id, "status:", mpData.status);

      // Update subscription in database
      const now = new Date();
      const expiresAt = plan === "monthly"
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: plan,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: now.toISOString(),
        }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          success: true,
          subscription_id: mpData.id,
          status: mpData.status,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fallback: create checkout URL (redirect mode)
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
          frequency_type: "months",
          transaction_amount: price,
          currency_id: "BRL",
        },
        back_url: `${req.headers.get("origin") || "https://pconflux.lovable.app"}/client`,
        payer_email: payerEmail,
        external_reference: JSON.stringify({
          user_id: user.id,
          plan: plan,
        }),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP API Error:", JSON.stringify(mpData));
      return new Response(JSON.stringify({ error: "Erro ao criar assinatura", details: mpData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
