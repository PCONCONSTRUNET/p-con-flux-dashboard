import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { plan, email, doc_number, first_name, last_name } = body;

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

    const configMap: Record<string, string> = {};
    settings?.forEach((s: { key: string; value: string }) => {
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

    const planTitle = plan === "monthly" ? "P-CON FLUX Mensal" : "P-CON FLUX Anual";
    const payerEmail = email || user.email;

    // Create PIX payment via Mercado Pago Payments API
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `${user.id}-${plan}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: price,
        description: planTitle,
        payment_method_id: "pix",
        payer: {
          email: payerEmail,
          first_name: first_name || "Cliente",
          last_name: last_name || "",
          identification: {
            type: "CPF",
            number: doc_number || "",
          },
        },
        external_reference: `${user.id}|${plan}|${planTitle}`,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mp-webhook`,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP PIX Error:", JSON.stringify(mpData));
      const errorMsg = mpData?.message || "Erro ao gerar PIX";
      return new Response(JSON.stringify({ error: errorMsg, details: mpData }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("MP PIX Payment created:", mpData.id, "status:", mpData.status);

    const pixInfo = mpData.point_of_interaction?.transaction_data;

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: mpData.id,
        status: mpData.status,
        qr_code: pixInfo?.qr_code || "",
        qr_code_base64: pixInfo?.qr_code_base64 || "",
        ticket_url: pixInfo?.ticket_url || "",
        expiration: mpData.date_of_expiration || "",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("PIX Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
