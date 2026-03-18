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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Count today's signals stats before archiving
    const { data: todaySignals, error: fetchError } = await supabase
      .from("signals")
      .select("result")
      .eq("archived", false);

    if (fetchError) throw fetchError;

    const total = todaySignals?.length || 0;
    const greens = todaySignals?.filter((s: any) => s.result === "green").length || 0;
    const losses = todaySignals?.filter((s: any) => s.result === "loss").length || 0;
    const winRate = greens + losses > 0 ? Math.round((greens / (greens + losses)) * 10000) / 100 : 0;

    // 2. Save daily stats (upsert for today's date)
    const today = new Date().toISOString().split("T")[0];
    
    if (total > 0) {
      const { error: statsError } = await supabase
        .from("daily_signal_stats")
        .upsert(
          {
            date: today,
            total_signals: total,
            greens,
            losses,
            win_rate: winRate,
          },
          { onConflict: "date" }
        );

      if (statsError) throw statsError;
    }

    // 3. Archive all current signals (mark as archived)
    const { error: archiveError } = await supabase
      .from("signals")
      .update({ archived: true })
      .eq("archived", false);

    if (archiveError) throw archiveError;

    console.log(`Daily reset complete: ${total} signals archived. Greens: ${greens}, Losses: ${losses}, Win Rate: ${winRate}%`);

    return new Response(
      JSON.stringify({
        success: true,
        archived: total,
        stats: { greens, losses, win_rate: winRate },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in daily reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
