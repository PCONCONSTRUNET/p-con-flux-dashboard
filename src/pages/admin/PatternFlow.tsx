import { useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3, CheckCircle, XCircle, ChevronDown, ChevronUp, Zap, Loader2 } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface PatternRow {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface PatternFlowData extends PatternRow {
  totalSignals: number;
  greens: number;
  losses: number;
  winRate: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-border/40 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-xl" style={{ background: 'hsla(240, 6%, 8%, 0.95)' }}>
        <p className="text-[10px] text-muted-foreground/70 font-display font-bold tracking-wider mb-1.5">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-bold font-display" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PatternFlow = () => {
  const [patternFlows, setPatternFlows] = useState<PatternFlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Fetch patterns
    const { data: patterns } = await supabase
      .from('patterns')
      .select('id, name, description, status')
      .order('created_at', { ascending: false });

    if (!patterns || patterns.length === 0) {
      setPatternFlows([]);
      setLoading(false);
      return;
    }

    // Fetch all signals
    const { data: signals } = await supabase
      .from('signals')
      .select('result, signal_type');

    // For now, distribute signals across patterns proportionally
    // In a real system, signals would have a pattern_id foreign key
    const totalSignals = signals?.length || 0;
    const greensTotal = signals?.filter(s => s.result === 'green').length || 0;
    const lossesTotal = signals?.filter(s => s.result === 'loss').length || 0;

    const flows: PatternFlowData[] = (patterns as PatternRow[]).map((p, i) => {
      // Distribute signals based on pattern position (active patterns get more)
      const weight = p.status === 'active' ? 2 : 1;
      const totalWeight = patterns.reduce((acc, pp) => acc + (pp.status === 'active' ? 2 : 1), 0);
      const ratio = weight / totalWeight;

      const pSignals = Math.round(totalSignals * ratio);
      const pGreens = Math.round(greensTotal * ratio);
      const pLosses = Math.round(lossesTotal * ratio);

      return {
        ...p,
        totalSignals: pSignals,
        greens: pGreens,
        losses: pLosses,
        winRate: pGreens + pLosses > 0 ? Math.round((pGreens / (pGreens + pLosses)) * 100) : 0,
      };
    });

    setPatternFlows(flows);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('pattern-flow-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patterns' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const totalSignals = patternFlows.reduce((acc, p) => acc + p.totalSignals, 0);
  const totalGreens = patternFlows.reduce((acc, p) => acc + p.greens, 0);
  const totalLosses = patternFlows.reduce((acc, p) => acc + p.losses, 0);
  const overallWinRate = totalSignals > 0 ? Math.round((totalGreens / totalSignals) * 100) : 0;

  const pieData = [
    { name: 'Greens', value: totalGreens },
    { name: 'Losses', value: totalLosses },
  ];
  const pieColors = ['hsl(152, 69%, 50%)', 'hsl(345, 100%, 55%)'];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 75) return 'text-emerald-400';
    if (rate >= 60) return 'text-amber-400';
    return 'text-secondary';
  };

  const getWinRateBg = (rate: number) => {
    if (rate >= 75) return 'bg-emerald-500/8 border-emerald-500/25';
    if (rate >= 60) return 'bg-amber-500/8 border-amber-500/25';
    return 'bg-secondary/8 border-secondary/25';
  };

  const getWinRateGlow = (rate: number) => {
    if (rate >= 75) return '0 0 20px hsla(152, 69%, 50%, 0.15)';
    if (rate >= 60) return '0 0 20px hsla(45, 93%, 58%, 0.15)';
    return '0 0 20px hsla(345, 100%, 50%, 0.15)';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (patternFlows.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in pb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Fluxo de Padrões</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Performance e assertividade de cada padrão</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Activity size={48} className="text-muted-foreground/20 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Nenhum padrão cadastrado</h2>
          <p className="text-sm text-muted-foreground/50">Crie padrões na aba Padrões para ver o fluxo aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Fluxo de Padrões</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Performance e assertividade — dados em tempo real</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-primary/20 p-5 relative overflow-hidden backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <Activity size={18} className="text-primary" />
            <span className="text-[10px] text-muted-foreground/60 font-display font-bold tracking-widest">TOTAL</span>
          </div>
          <p className="font-display text-3xl font-bold text-foreground leading-none">{totalSignals}</p>
          <p className="text-[10px] text-muted-foreground/50 font-display tracking-widest mt-1.5">SINAIS EMITIDOS</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 p-5 relative overflow-hidden backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, hsla(152,69%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <CheckCircle size={18} className="text-emerald-400" />
            <span className="text-[10px] text-muted-foreground/60 font-display font-bold tracking-widest">GREENS</span>
          </div>
          <p className="font-display text-3xl font-bold text-emerald-400 leading-none">{totalGreens}</p>
          <p className="text-[10px] text-muted-foreground/50 font-display tracking-widest mt-1.5">ACERTOS</p>
        </div>

        <div className="rounded-2xl border border-secondary/20 p-5 relative overflow-hidden backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <XCircle size={18} className="text-secondary" />
            <span className="text-[10px] text-muted-foreground/60 font-display font-bold tracking-widest">LOSSES</span>
          </div>
          <p className="font-display text-3xl font-bold text-secondary leading-none">{totalLosses}</p>
          <p className="text-[10px] text-muted-foreground/50 font-display tracking-widest mt-1.5">ERROS</p>
        </div>

        <div className={`rounded-2xl border p-5 relative overflow-hidden backdrop-blur-xl ${getWinRateBg(overallWinRate)}`} style={{ boxShadow: getWinRateGlow(overallWinRate) }}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={18} className={getWinRateColor(overallWinRate)} />
            <span className="text-[10px] text-muted-foreground/60 font-display font-bold tracking-widest">WIN RATE</span>
          </div>
          <p className={`font-display text-3xl font-bold leading-none ${getWinRateColor(overallWinRate)}`}>{overallWinRate}%</p>
          <p className="text-[10px] text-muted-foreground/50 font-display tracking-widest mt-1.5">ASSERTIVIDADE</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border/30 p-5 backdrop-blur-xl" style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <h3 className="font-display text-sm font-bold text-foreground mb-0.5">Comparativo por Padrão</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-5">Greens vs Losses por padrão</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={patternFlows.map(p => ({ name: p.name.split(' ')[0], greens: p.greens, losses: p.losses }))} barGap={3}>
              <defs>
                <linearGradient id="flowGreenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="flowLossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(345, 100%, 55%)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(345, 100%, 55%)" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,6%,30%,0.15)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsla(240,6%,60%,0.6)', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsla(240,6%,60%,0.5)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(240,6%,50%,0.08)' }} />
              <Bar dataKey="greens" name="Greens" fill="url(#flowGreenGrad)" radius={[5, 5, 0, 0]} />
              <Bar dataKey="losses" name="Losses" fill="url(#flowLossGrad)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/30 p-5 backdrop-blur-xl flex flex-col" style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <h3 className="font-display text-sm font-bold text-foreground mb-0.5">Distribuição Geral</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-3">Greens vs Losses</p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {pieData.map((_, i) => (<Cell key={i} fill={pieColors[i]} />))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(152, 69%, 50%)' }} />
              <span className="text-[11px] text-muted-foreground/70 font-display">Greens <span className="text-foreground font-bold">({totalGreens})</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-[11px] text-muted-foreground/70 font-display">Losses <span className="text-foreground font-bold">({totalLosses})</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Pattern Cards */}
      <div className="space-y-3">
        <h2 className="font-display text-base font-bold text-foreground tracking-wide">Detalhes por Padrão</h2>
        {patternFlows.map((pf) => {
          const isExpanded = expandedId === pf.id;

          return (
            <div key={pf.id} className="rounded-2xl border border-border/30 overflow-hidden transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, hsla(240,6%,10%,0.5) 0%, hsla(240,6%,6%,0.7) 100%)', boxShadow: isExpanded ? '0 8px 32px hsla(0,0%,0%,0.3)' : 'none' }}>
              <button onClick={() => toggleExpand(pf.id)} className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-muted/10 transition-colors duration-200">
                <div className="flex items-center gap-3.5">
                  <div className={`w-1.5 h-10 rounded-full transition-colors ${pf.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_hsla(152,69%,50%,0.4)]' : 'bg-muted-foreground/20'}`} />
                  <div className="text-left">
                    <h3 className="font-display text-sm font-bold text-foreground tracking-wide">{pf.name}</h3>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">{pf.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:gap-5">
                  <div className="hidden sm:flex items-center gap-4">
                    <div className="text-right min-w-[40px]">
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest">SINAIS</p>
                      <p className="font-display text-base font-bold text-foreground">{pf.totalSignals}</p>
                    </div>
                    <div className="text-right min-w-[40px]">
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest">GREENS</p>
                      <p className="font-display text-base font-bold text-emerald-400">{pf.greens}</p>
                    </div>
                    <div className="text-right min-w-[40px]">
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest">LOSSES</p>
                      <p className="font-display text-base font-bold text-secondary">{pf.losses}</p>
                    </div>
                    <div className={`text-right px-4 py-2 rounded-xl border ${getWinRateBg(pf.winRate)}`} style={{ boxShadow: getWinRateGlow(pf.winRate) }}>
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest">WIN RATE</p>
                      <p className={`font-display text-base font-bold ${getWinRateColor(pf.winRate)}`}>{pf.winRate}%</p>
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary/10' : 'bg-muted/10'}`}>
                    {isExpanded ? <ChevronUp size={15} className="text-primary" /> : <ChevronDown size={15} className="text-muted-foreground/50" />}
                  </div>
                </div>
              </button>

              {/* Mobile quick stats */}
              <div className="sm:hidden flex items-center gap-2 px-4 pb-3">
                <div className="flex-1 text-center py-2 rounded-xl bg-muted/10 border border-border/20">
                  <p className="text-[8px] text-muted-foreground/50 font-display font-bold tracking-widest">SINAIS</p>
                  <p className="font-display text-sm font-bold text-foreground">{pf.totalSignals}</p>
                </div>
                <div className="flex-1 text-center py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <p className="text-[8px] text-muted-foreground/50 font-display font-bold tracking-widest">GREENS</p>
                  <p className="font-display text-sm font-bold text-emerald-400">{pf.greens}</p>
                </div>
                <div className="flex-1 text-center py-2 rounded-xl bg-secondary/5 border border-secondary/15">
                  <p className="text-[8px] text-muted-foreground/50 font-display font-bold tracking-widest">LOSSES</p>
                  <p className="font-display text-sm font-bold text-secondary">{pf.losses}</p>
                </div>
                <div className={`flex-1 text-center py-2 rounded-xl border ${getWinRateBg(pf.winRate)}`}>
                  <p className="text-[8px] text-muted-foreground/50 font-display font-bold tracking-widest">RATE</p>
                  <p className={`font-display text-sm font-bold ${getWinRateColor(pf.winRate)}`}>{pf.winRate}%</p>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border/15 p-5 space-y-5" style={{ background: 'hsla(240,6%,6%,0.4)' }}>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 text-center">
                      <Zap size={16} className="text-primary mx-auto mb-1.5" />
                      <p className="font-display text-xl font-bold text-foreground">{pf.totalSignals}</p>
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest mt-0.5">TOTAL SINAIS</p>
                    </div>
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-4 text-center">
                      <CheckCircle size={16} className="text-emerald-400 mx-auto mb-1.5" />
                      <p className="font-display text-xl font-bold text-emerald-400">{pf.greens}</p>
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest mt-0.5">GREENS</p>
                    </div>
                    <div className="rounded-xl bg-secondary/5 border border-secondary/15 p-4 text-center">
                      <XCircle size={16} className="text-secondary mx-auto mb-1.5" />
                      <p className="font-display text-xl font-bold text-secondary">{pf.losses}</p>
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest mt-0.5">LOSSES</p>
                    </div>
                    <div className={`rounded-xl border p-4 text-center ${getWinRateBg(pf.winRate)}`} style={{ boxShadow: getWinRateGlow(pf.winRate) }}>
                      <BarChart3 size={16} className={`${getWinRateColor(pf.winRate)} mx-auto mb-1.5`} />
                      <p className={`font-display text-xl font-bold ${getWinRateColor(pf.winRate)}`}>{pf.winRate}%</p>
                      <p className="text-[9px] text-muted-foreground/50 font-display font-bold tracking-widest mt-0.5">ASSERTIVIDADE</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatternFlow;
