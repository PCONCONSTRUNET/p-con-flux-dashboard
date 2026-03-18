import { useState } from 'react';
import { mockPatterns, mockSignals } from '@/data/mockData';
import { Activity, TrendingUp, TrendingDown, BarChart3, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// Generate mock flow data per pattern
const generatePatternFlowData = () => {
  return mockPatterns.map((pattern) => {
    const totalSignals = Math.floor(Math.random() * 80) + 20;
    const greens = Math.floor(totalSignals * (0.6 + Math.random() * 0.3));
    const losses = totalSignals - greens;
    const winRate = Math.round((greens / totalSignals) * 100);
    const streak = Math.floor(Math.random() * 8) + 1;
    const isStreakGreen = Math.random() > 0.3;

    // Hourly data
    const hourlyData = Array.from({ length: 8 }, (_, i) => {
      const g = Math.floor(Math.random() * 10) + 1;
      const l = Math.floor(Math.random() * 4);
      return { hour: `${(i * 3).toString().padStart(2, '0')}h`, greens: g, losses: l };
    });

    // Daily data (last 7 days)
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const dailyData = days.map((day) => {
      const g = Math.floor(Math.random() * 15) + 3;
      const l = Math.floor(Math.random() * 6);
      return { day, greens: g, losses: l, rate: Math.round((g / (g + l)) * 100) };
    });

    return {
      ...pattern,
      totalSignals,
      greens,
      losses,
      winRate,
      streak,
      isStreakGreen,
      hourlyData,
      dailyData,
    };
  });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/30 rounded-xl px-3 py-2 shadow-xl" style={{ background: 'hsl(240, 6%, 10%)' }}>
        <p className="text-[10px] text-muted-foreground/60 font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PatternFlow = () => {
  const [patternFlows] = useState(generatePatternFlowData);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalSignals = patternFlows.reduce((acc, p) => acc + p.totalSignals, 0);
  const totalGreens = patternFlows.reduce((acc, p) => acc + p.greens, 0);
  const totalLosses = patternFlows.reduce((acc, p) => acc + p.losses, 0);
  const overallWinRate = totalSignals > 0 ? Math.round((totalGreens / totalSignals) * 100) : 0;

  const pieData = [
    { name: 'Greens', value: totalGreens },
    { name: 'Losses', value: totalLosses },
  ];
  const pieColors = ['hsl(152, 69%, 45%)', 'hsl(var(--secondary))'];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 75) return 'text-emerald-400';
    if (rate >= 60) return 'text-yellow-400';
    return 'text-secondary';
  };

  const getWinRateBg = (rate: number) => {
    if (rate >= 75) return 'bg-emerald-500/10 border-emerald-500/20';
    if (rate >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-secondary/10 border-secondary/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-xl font-bold text-foreground tracking-wide">Fluxo de Padrões</h1>
        <p className="text-xs text-muted-foreground mt-1">Performance e assertividade de cada padrão</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <Activity size={16} className="text-primary" />
            <span className="text-[10px] text-muted-foreground font-display">TOTAL</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{totalSignals}</p>
          <p className="text-[10px] text-muted-foreground font-display tracking-wider">SINAIS EMITIDOS</p>
        </div>

        <div className="rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(135deg, hsla(152,69%,45%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={16} className="text-emerald-400" />
            <span className="text-[10px] text-muted-foreground font-display">GREENS</span>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-400">{totalGreens}</p>
          <p className="text-[10px] text-muted-foreground font-display tracking-wider">ACERTOS</p>
        </div>

        <div className="rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <XCircle size={16} className="text-secondary" />
            <span className="text-[10px] text-muted-foreground font-display">LOSSES</span>
          </div>
          <p className="font-display text-2xl font-bold text-secondary">{totalLosses}</p>
          <p className="text-[10px] text-muted-foreground font-display tracking-wider">ERROS</p>
        </div>

        <div className={`rounded-2xl border p-4 ${getWinRateBg(overallWinRate)}`}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={16} className={getWinRateColor(overallWinRate)} />
            <span className="text-[10px] text-muted-foreground font-display">WIN RATE</span>
          </div>
          <p className={`font-display text-2xl font-bold ${getWinRateColor(overallWinRate)}`}>{overallWinRate}%</p>
          <p className="text-[10px] text-muted-foreground font-display tracking-wider">ASSERTIVIDADE</p>
        </div>
      </div>

      {/* Overall Chart + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(135deg, hsla(240,6%,10%,0.6) 0%, hsla(240,6%,6%,0.8) 100%)' }}>
          <h3 className="font-display text-sm font-bold text-foreground mb-1">Comparativo por Padrão</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Greens vs Losses por padrão</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={patternFlows.map(p => ({ name: p.name.split(' ')[0], greens: p.greens, losses: p.losses }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.04)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="greens" name="Greens" fill="hsl(152, 69%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" name="Losses" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border/30 p-4" style={{ background: 'linear-gradient(135deg, hsla(240,6%,10%,0.6) 0%, hsla(240,6%,6%,0.8) 100%)' }}>
          <h3 className="font-display text-sm font-bold text-foreground mb-1">Distribuição Geral</h3>
          <p className="text-[10px] text-muted-foreground mb-2">Greens vs Losses</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Greens ({totalGreens})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="text-[10px] text-muted-foreground">Losses ({totalLosses})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Pattern Cards */}
      <div className="space-y-3">
        <h2 className="font-display text-sm font-bold text-foreground tracking-wide">Detalhes por Padrão</h2>
        {patternFlows.map((pf) => (
          <div
            key={pf.id}
            className="rounded-2xl border border-border/30 overflow-hidden transition-all"
            style={{ background: 'linear-gradient(135deg, hsla(240,6%,10%,0.5) 0%, hsla(240,6%,6%,0.7) 100%)' }}
          >
            {/* Card Header */}
            <button
              onClick={() => toggleExpand(pf.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${pf.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                <div className="text-left">
                  <h3 className="font-display text-sm font-bold text-foreground">{pf.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{pf.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Quick stats */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-display">SINAIS</p>
                    <p className="font-display text-sm font-bold text-foreground">{pf.totalSignals}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-display">GREENS</p>
                    <p className="font-display text-sm font-bold text-emerald-400">{pf.greens}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-display">LOSSES</p>
                    <p className="font-display text-sm font-bold text-secondary">{pf.losses}</p>
                  </div>
                  <div className={`text-right px-3 py-1.5 rounded-xl border ${getWinRateBg(pf.winRate)}`}>
                    <p className="text-[10px] text-muted-foreground font-display">WIN RATE</p>
                    <p className={`font-display text-sm font-bold ${getWinRateColor(pf.winRate)}`}>{pf.winRate}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-[10px] font-display ${pf.isStreakGreen ? 'text-emerald-400' : 'text-secondary'}`}>
                    {pf.isStreakGreen ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {pf.streak}x
                  </div>
                  {expandedId === pf.id ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </div>
            </button>

            {/* Mobile quick stats */}
            <div className="sm:hidden flex items-center gap-3 px-4 pb-3">
              <div className="flex-1 text-center py-1.5 rounded-lg bg-muted/20">
                <p className="text-[9px] text-muted-foreground font-display">SINAIS</p>
                <p className="font-display text-xs font-bold text-foreground">{pf.totalSignals}</p>
              </div>
              <div className="flex-1 text-center py-1.5 rounded-lg bg-emerald-500/10">
                <p className="text-[9px] text-muted-foreground font-display">GREENS</p>
                <p className="font-display text-xs font-bold text-emerald-400">{pf.greens}</p>
              </div>
              <div className="flex-1 text-center py-1.5 rounded-lg bg-secondary/10">
                <p className="text-[9px] text-muted-foreground font-display">LOSSES</p>
                <p className="font-display text-xs font-bold text-secondary">{pf.losses}</p>
              </div>
              <div className={`flex-1 text-center py-1.5 rounded-lg border ${getWinRateBg(pf.winRate)}`}>
                <p className="text-[9px] text-muted-foreground font-display">RATE</p>
                <p className={`font-display text-xs font-bold ${getWinRateColor(pf.winRate)}`}>{pf.winRate}%</p>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === pf.id && (
              <div className="border-t border-border/20 p-4 space-y-4">
                {/* Detailed stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-muted/10 border border-border/20 p-3 text-center">
                    <Clock size={14} className="text-primary mx-auto mb-1" />
                    <p className="font-display text-lg font-bold text-foreground">{pf.totalSignals}</p>
                    <p className="text-[9px] text-muted-foreground font-display">TOTAL SINAIS</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3 text-center">
                    <CheckCircle size={14} className="text-emerald-400 mx-auto mb-1" />
                    <p className="font-display text-lg font-bold text-emerald-400">{pf.greens}</p>
                    <p className="text-[9px] text-muted-foreground font-display">GREENS</p>
                  </div>
                  <div className="rounded-xl bg-secondary/5 border border-secondary/15 p-3 text-center">
                    <XCircle size={14} className="text-secondary mx-auto mb-1" />
                    <p className="font-display text-lg font-bold text-secondary">{pf.losses}</p>
                    <p className="text-[9px] text-muted-foreground font-display">LOSSES</p>
                  </div>
                  <div className={`rounded-xl border p-3 text-center ${getWinRateBg(pf.winRate)}`}>
                    <BarChart3 size={14} className={`${getWinRateColor(pf.winRate)} mx-auto mb-1`} />
                    <p className={`font-display text-lg font-bold ${getWinRateColor(pf.winRate)}`}>{pf.winRate}%</p>
                    <p className="text-[9px] text-muted-foreground font-display">ASSERTIVIDADE</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="rounded-xl border border-border/20 p-3" style={{ background: 'hsla(240,6%,8%,0.5)' }}>
                  <h4 className="font-display text-xs font-bold text-foreground mb-3">Performance Diária</h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pf.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.04)" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(0,0%,50%)' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="greens" name="Greens" fill="hsl(152, 69%, 45%)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="losses" name="Losses" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Streak info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-display">Sequência atual:</span>
                  <span className={`font-display font-bold ${pf.isStreakGreen ? 'text-emerald-400' : 'text-secondary'}`}>
                    {pf.streak}x {pf.isStreakGreen ? 'GREEN' : 'LOSS'}
                  </span>
                  {pf.isStreakGreen ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-secondary" />}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatternFlow;
