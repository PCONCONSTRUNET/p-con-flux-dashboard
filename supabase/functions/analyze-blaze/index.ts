import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map roll number to color
function rollToColor(roll: number): string {
  if (roll === 0) return 'white';
  if (roll >= 1 && roll <= 7) return 'red';
  return 'black';
}

// Check if a sequence of recent colors matches a pattern
function matchesPattern(
  recentColors: string[],
  recentRolls: number[],
  patternColors: string[],
  patternNumbers: number[],
  mode: string
): boolean {
  // Pattern matching by colors
  if (patternColors.length > 0) {
    const tail = recentColors.slice(0, patternColors.length);
    if (tail.length < patternColors.length) return false;

    const colorsMatch = patternColors.every((c, i) => tail[i] === c);

    if (mode === 'when_exit') {
      return colorsMatch;
    } else {
      // when_not_exit: pattern should NOT have appeared, trigger when broken
      return !colorsMatch;
    }
  }

  // Pattern matching by numbers
  if (patternNumbers.length > 0) {
    const tailNums = recentRolls.slice(0, patternNumbers.length);
    if (tailNums.length < patternNumbers.length) return false;

    const numbersMatch = patternNumbers.every((n, i) => tailNums[i] === n);

    if (mode === 'when_exit') {
      return numbersMatch;
    } else {
      return !numbersMatch;
    }
  }

  return false;
}

// Determine signal entry text based on pattern
function buildEntryText(recentColors: string[], victoryTarget: string): string {
  const last3 = recentColors.slice(0, 3);
  const colorLabels: Record<string, string> = {
    red: 'Vermelho',
    black: 'Preto',
    white: 'Branco',
  };

  const sequence = last3.map(c => colorLabels[c] || c).join(', ');

  const targetLabels: Record<string, string> = {
    reds: 'Vermelho',
    blacks: 'Preto',
    whites: 'Branco',
    'blacks-whites': 'Preto/Branco',
    'reds-whites': 'Vermelho/Branco',
    any: 'Qualquer',
  };

  const target = targetLabels[victoryTarget] || victoryTarget;

  return `${last3.length}x ${colorLabels[last3[0]] || last3[0]} → ${target}`;
}

function buildProtectionText(gales: number): string {
  if (gales === 0) return 'Sem proteção';
  return `${gales} Gale${gales > 1 ? 's' : ''}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Parse incoming Blaze results from the API
    let blazeResults: { id: string; color: number; roll: number; created_at: string }[] = [];

    try {
      const body = await req.json();
      if (body.results && Array.isArray(body.results)) {
        blazeResults = body.results;
      }
    } catch {
      // If no body, try fetching from the external API
      const apiUrl = Deno.env.get("BLAZE_API_URL") || "http://localhost:3000";
      try {
        const resp = await fetch(`${apiUrl}/api/double/recent`, {
          signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
          const data = await resp.json();
          blazeResults = data.data || data.results || [];
        }
      } catch (fetchErr) {
        console.error("Failed to fetch Blaze results:", fetchErr);
        return new Response(
          JSON.stringify({ error: "Cannot fetch Blaze results", details: String(fetchErr) }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (blazeResults.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No results to analyze", signals_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Map results to colors/rolls (most recent first)
    const recentColors = blazeResults.map(r => rollToColor(typeof r.color === 'number' ? r.roll : r.roll));
    const recentRolls = blazeResults.map(r => r.roll);

    // 3. Fetch active patterns
    const { data: patterns, error: pErr } = await supabase
      .from("patterns")
      .select("*")
      .eq("status", "active");

    if (pErr) throw pErr;
    if (!patterns || patterns.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active patterns", signals_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Check for recent pending signals to avoid duplicates (last 2 minutes)
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: recentSignals } = await supabase
      .from("signals")
      .select("entry, created_at")
      .eq("archived", false)
      .gte("created_at", twoMinAgo);

    const recentEntries = new Set((recentSignals || []).map(s => s.entry));

    // 5. Analyze each pattern against recent results
    let signalsCreated = 0;
    const newSignals: any[] = [];

    for (const pattern of patterns) {
      const patternColors = (pattern.colors || []) as string[];
      const patternNumbers = (pattern.numbers || []) as number[];
      const mode = pattern.mode || "when_exit";
      const gales = pattern.gales || 0;
      const victoryTarget = pattern.victory_target || "any";

      const matched = matchesPattern(recentColors, recentRolls, patternColors, patternNumbers, mode);

      if (matched) {
        const entryText = buildEntryText(recentColors, victoryTarget);

        // Skip if we already sent this signal recently
        if (recentEntries.has(entryText)) continue;

        const signalData = {
          signal_type: pattern.name,
          entry: entryText,
          protection: buildProtectionText(gales),
          result: "pending",
          rounds: 0,
          target: "Double",
        };

        newSignals.push(signalData);
        recentEntries.add(entryText);
        signalsCreated++;
      }
    }

    // 6. Insert matched signals
    if (newSignals.length > 0) {
      const { error: insertErr } = await supabase
        .from("signals")
        .insert(newSignals);

      if (insertErr) throw insertErr;
    }

    // 7. Auto-resolve old pending signals (older than 5 minutes)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: pendingSignals } = await supabase
      .from("signals")
      .select("id, entry, created_at")
      .eq("result", "pending")
      .eq("archived", false)
      .lt("created_at", fiveMinAgo);

    if (pendingSignals && pendingSignals.length > 0) {
      // Check if the victory target color appeared in recent results
      for (const pending of pendingSignals) {
        const entryParts = pending.entry.split("→");
        const targetColor = entryParts[1]?.trim().toLowerCase();

        let resolved = false;
        let result = "loss";

        // Check last 10 results for the target color
        const checkColors = recentColors.slice(0, 10);
        const colorMap: Record<string, string> = {
          vermelho: "red",
          preto: "black",
          branco: "white",
          "preto/branco": "black",
          "vermelho/branco": "red",
        };
        const mappedTarget = colorMap[targetColor] || targetColor;

        if (mappedTarget === "qualquer" || checkColors.includes(mappedTarget)) {
          result = "green";
        }

        await supabase
          .from("signals")
          .update({ result, rounds: 1 })
          .eq("id", pending.id);
      }
    }

    console.log(`Analyze complete: ${signalsCreated} new signals from ${patterns.length} patterns`);

    return new Response(
      JSON.stringify({
        success: true,
        signals_created: signalsCreated,
        patterns_checked: patterns.length,
        results_analyzed: blazeResults.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing Blaze:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
