import { useEffect, useState, useMemo } from 'react';
import { mockPatterns, mockAlerts, mockSignals } from '@/data/mockData';
import { Users, TrendingUp, Crown, Zap, Clock, DollarSign, Activity, ArrowRight, ArrowUpRight, ArrowDownRight, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type FilterType = 'today' | 'weekly' | 'monthly' | 'custom';

// Generate data sets for each filter
const revenueDataSets: Record<Exclude<FilterType, 'custom'>, { label: string; revenue: number; clients: number }[]> = {
  today: [
    { label: '06h', revenue: 320, clients: 1 },
    { label: '09h', revenue: 580, clients: 2 },
    { label: '12h', revenue: 950, clients: 3 },
    { label: '15h', revenue: 1200, clients: 2 },
    { label: '18h', revenue: 800, clients: 1 },
    { label: '21h', revenue: 450, clients: 1 },
  ],
  weekly: [
    { label: 'Seg', revenue: 1200, clients: 3 },
    { label: 'Ter', revenue: 1800, clients: 5 },
    { label: 'Qua', revenue: 2400, clients: 4 },
    { label: 'Qui', revenue: 1600, clients: 6 },
    { label: 'Sex', revenue: 3200, clients: 8 },
    { label: 'Sáb', revenue: 2800, clients: 7 },
    { label: 'Dom', revenue: 2100, clients: 4 },
  ],
  monthly: [
    { label: 'Sem 1', revenue: 8200, clients: 12 },
    { label: 'Sem 2', revenue: 9500, clients: 15 },
    { label: 'Sem 3', revenue: 11200, clients: 18 },
    { label: 'Sem 4', revenue: 13100, clients: 22 },
  ],
};

const signalDataSets: Record<Exclude<FilterType, 'custom'>, { label: string; greens: number; losses: number }[]> = {
  today: [
    { label: '06h', greens: 5, losses: 1 },
    { label: '09h', greens: 8, losses: 2 },
    { label: '12h', greens: 12, losses: 3 },
    { label: '15h', greens: 10, losses: 2 },
    { label: '18h', greens: 7, losses: 1 },
    { label: '21h', greens: 4, losses: 1 },
  ],
  weekly: [
    { label: 'Seg', greens: 12, losses: 2 },
    { label: 'Ter', greens: 8, losses: 3 },
    { label: 'Qua', greens: 18, losses: 4 },
    { label: 'Qui', greens: 24, losses: 5 },
    { label: 'Sex', greens: 20, losses: 3 },
    { label: 'Sáb', greens: 15, losses: 2 },
    { label: 'Dom', greens: 10, losses: 1 },
  ],
  monthly: [
    { label: 'Sem 1', greens: 45, losses: 8 },
    { label: 'Sem 2', greens: 52, losses: 10 },
    { label: 'Sem 3', greens: 60, losses: 12 },
    { label: 'Sem 4', greens: 55, losses: 9 },
  ],
};

const filterLabels: Record<FilterType, string> = {
  today: 'Hoje',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizado',
};

const periodSubtitle: Record<Exclude<FilterType, 'custom'>, string> = {
  today: 'Últimas 24 horas',
  weekly: 'Últimos 7 dias',
  monthly: 'Últimos 30 dias',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/30 rounded-xl px-3 py-2 shadow-xl" style={{ background: 'hsl(240, 6%, 10%)' }}>
        <p className="text-[10px] text-muted-foreground/60 font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) =>
          <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' && p.name === 'Receita' ? `R$ ${p.value.toLocaleString('pt-BR')}` : p.value}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const activePatterns = mockPatterns.filter((p) => p.status === 'active').length;
  const greens = mockSignals.filter((s) => s.result === 'green').length;
  const losses = mockSignals.filter((s) => s.result === 'loss').length;
  const winRate = greens + losses > 0 ? Math.round(greens / (greens + losses) * 100) : 0;

  const [filter, setFilter] = useState<FilterType>('weekly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [clientStats, setClientStats] = useState({ total: 0, trial: 0, monthly: 0, annual: 0, active: 0, expired: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id');
      const { data: subs } = await supabase.from('subscriptions').select('plan, expires_at, is_active');

      const total = profiles?.length || 0;
      const trial = subs?.filter((s) => s.plan === 'trial').length || 0;
      const monthly = subs?.filter((s) => s.plan === 'monthly').length || 0;
      const annual = subs?.filter((s) => s.plan === 'annual').length || 0;
      const now = new Date();
      const active = subs?.filter((s) => new Date(s.expires_at) > now && s.is_active).length || 0;
      const expired = subs?.filter((s) => new Date(s.expires_at) <= now).length || 0;

      setClientStats({ total, trial, monthly, annual, active, expired });
    };
    fetchStats();
  }, []);

  const activeFilter = filter === 'custom' ? 'weekly' : filter;
  const revenueData = revenueDataSets[activeFilter];
  const signalPerformanceData = signalDataSets[activeFilter];

  const totalRevenue = useMemo(() => revenueData.reduce((acc, d) => acc + d.revenue, 0), [revenueData]);
  const totalGreens = useMemo(() => signalPerformanceData.reduce((acc, d) => acc + d.greens, 0), [signalPerformanceData]);
  const totalLosses = useMemo(() => signalPerformanceData.reduce((acc, d) => acc + d.losses, 0), [signalPerformanceData]);
  const filteredWinRate = totalGreens + totalLosses > 0 ? Math.round((totalGreens / (totalGreens + totalLosses)) * 100) : 0;

  const pieData = [
    { name: 'Trial', value: clientStats.trial || 2, color: 'hsl(45, 93%, 58%)' },
    { name: 'Mensal', value: clientStats.monthly || 5, color: 'hsl(187, 100%, 50%)' },
    { name: 'Anual', value: clientStats.annual || 3, color: 'hsl(152, 69%, 55%)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Visão geral do sistema P-CON FLUX</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border/30" style={{ background: 'hsla(240,6%,10%,0.8)' }}>
          {(['today', 'weekly', 'monthly', 'custom'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-semibold tracking-wider transition-all ${
                filter === f
                  ? 'bg-primary/15 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date picker */}
      {filter === 'custom' && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30" style={{ background: 'hsla(240,6%,10%,0.6)' }}>
          <Calendar size={14} className="text-primary" />
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground font-display">DE:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-muted/20 border border-border/30 rounded-lg px-2 py-1 text-xs text-foreground outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground font-display">ATÉ:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-muted/20 border border-border/30 rounded-lg px-2 py-1 text-xs text-foreground outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => navigate('/admin/clients')}
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(152, 69%, 55%)' }} />
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={18} className="text-emerald-400" />
            <div className="flex items-center gap-0.5 text-emerald-400">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-bold">+12%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Receita {filterLabels[filter]}</p>
        </div>

        <div
          className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => navigate('/admin/clients')}
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(187, 100%, 50%)' }} />
          <div className="flex items-center justify-between mb-3">
            <Users size={18} className="text-primary" />
            <div className="flex items-center gap-0.5 text-primary">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-bold">+{clientStats.trial || 2}</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{clientStats.total || 10}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Clientes Total</p>
        </div>

        <div
          className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(152, 69%, 55%)' }} />
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{filteredWinRate}%</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Win Rate Geral</p>
        </div>

        <div
          className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(45, 93%, 58%)' }} />
          <div className="flex items-center justify-between mb-3">
            <Activity size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{activePatterns}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Padrões Ativos</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Receita {filterLabels[filter]}</h3>
              <p className="text-[10px] text-muted-foreground/50">{periodSubtitle[activeFilter]}</p>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-bold">+12.5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="50%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(187, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,6%,30%,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(240,6%,50%,0.1)' }} />
              <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(187, 100%, 50%)" strokeWidth={2.5} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}
        >
          <h3 className="text-sm font-bold text-foreground mb-1">Distribuição de Planos</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-3">Clientes por tipo</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-[11px] text-muted-foreground/70">{p.name}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signal Performance */}
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Performance de Sinais</h3>
              <p className="text-[10px] text-muted-foreground/50">Greens vs Losses — {periodSubtitle[activeFilter]}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={signalPerformanceData} barGap={2}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(345, 100%, 50%)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(345, 100%, 50%)" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,6%,30%,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(240,6%,50%,0.1)' }} />
              <Bar dataKey="greens" name="Greens" fill="url(#greenGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="losses" name="Losses" fill="url(#lossGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Stats Cards */}
        <div className="space-y-3">
          <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
              <Zap size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">P-CON FLUX MENSAL</p>
              <p className="text-[10px] text-muted-foreground/50">{clientStats.monthly || 5} assinantes ativos</p>
            </div>
            <p className="text-lg font-bold text-primary">{clientStats.monthly || 5}</p>
          </div>

          <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center shadow-lg shadow-emerald-400/10">
              <Crown size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">P-CON FLUX ANUAL</p>
              <p className="text-[10px] text-muted-foreground/50">{clientStats.annual || 3} assinantes ativos</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">{clientStats.annual || 3}</p>
          </div>

          <div className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center shadow-lg shadow-amber-400/10">
              <Clock size={22} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Trial (3h Grátis)</p>
              <p className="text-[10px] text-muted-foreground/50">{clientStats.trial || 2} em teste • {clientStats.expired || 1} expirados</p>
            </div>
            <p className="text-lg font-bold text-amber-400">{clientStats.trial || 2}</p>
          </div>

          <div className="rounded-2xl p-4 border border-secondary/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center">
              <BarChart3 size={22} className="text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Sinais {filterLabels[filter]}</p>
              <p className="text-[10px] text-muted-foreground/50">{totalGreens} greens • {totalLosses} losses</p>
            </div>
            <p className="text-lg font-bold text-foreground">{totalGreens + totalLosses}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/admin/patterns')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-primary/25 text-primary flex items-center justify-center gap-2 hover:bg-primary/10"
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}
        >
          Padrões <ArrowRight size={14} />
        </button>
        <button
          onClick={() => navigate('/admin/clients')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-emerald-500/25 text-emerald-400 flex items-center justify-center gap-2 hover:bg-emerald-500/10"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}
        >
          Clientes <ArrowRight size={14} />
        </button>
        <button
          onClick={() => navigate('/admin/pattern-flow')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-secondary/25 text-secondary flex items-center justify-center gap-2 hover:bg-secondary/10 col-span-2 lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}
        >
          Fluxo <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
