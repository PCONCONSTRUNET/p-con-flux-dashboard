import { useEffect, useState, useMemo } from 'react';
import { Users, TrendingUp, Crown, Zap, Clock, DollarSign, Activity, ArrowRight, ArrowUpRight, BarChart3, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ExportImportBar from '@/components/ExportImportBar';
import { exportToPDF, exportToExcel, importFromExcel } from '@/utils/exportImport';
import { toast } from 'sonner';

type FilterType = 'today' | 'weekly' | 'monthly' | 'custom';

const filterLabels: Record<FilterType, string> = {
  today: 'Hoje',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizado',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border/30 rounded-xl px-3 py-2 shadow-xl" style={{ background: 'hsl(240, 6%, 10%)' }}>
        <p className="text-[10px] text-muted-foreground/60 font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) =>
          <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('weekly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [clientStats, setClientStats] = useState({ total: 0, trial: 0, monthly: 0, annual: 0, active: 0, expired: 0 });
  const [signalStats, setSignalStats] = useState({ total: 0, greens: 0, losses: 0, pending: 0 });
  const [activePatterns, setActivePatterns] = useState(0);
  const [dailyStats, setDailyStats] = useState<{ date: string; greens: number; losses: number; total_signals: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      // Client stats
      const [{ data: profiles }, { data: subs }] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('subscriptions').select('plan, expires_at, is_active'),
      ]);

      const total = profiles?.length || 0;
      const trial = subs?.filter(s => s.plan === 'trial').length || 0;
      const monthly = subs?.filter(s => s.plan === 'monthly').length || 0;
      const annual = subs?.filter(s => s.plan === 'annual').length || 0;
      const now = new Date();
      const active = subs?.filter(s => new Date(s.expires_at) > now && s.is_active).length || 0;
      const expired = subs?.filter(s => new Date(s.expires_at) <= now).length || 0;
      setClientStats({ total, trial, monthly, annual, active, expired });

      // Signal stats
      const { data: signals } = await supabase.from('signals').select('result');
      const greens = signals?.filter(s => s.result === 'green').length || 0;
      const losses = signals?.filter(s => s.result === 'loss').length || 0;
      const pending = signals?.filter(s => s.result === 'pending').length || 0;
      setSignalStats({ total: signals?.length || 0, greens, losses, pending });

      // Active patterns
      const { count } = await supabase.from('patterns').select('id', { count: 'exact', head: true }).eq('status', 'active');
      setActivePatterns(count || 0);

      // Daily signal stats
      const { data: daily } = await supabase.from('daily_signal_stats').select('date, greens, losses, total_signals').order('date', { ascending: true }).limit(30);
      setDailyStats(daily || []);
    };

    fetchAll();

    // Realtime for signals
    const channel = supabase
      .channel('admin-dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signals' }, () => { fetchAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patterns' }, () => { fetchAll(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => { fetchAll(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const winRate = signalStats.greens + signalStats.losses > 0 ? Math.round(signalStats.greens / (signalStats.greens + signalStats.losses) * 100) : 0;

  const signalChartData = useMemo(() => {
    if (dailyStats.length > 0) {
      return dailyStats.slice(-7).map(d => ({
        label: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
        greens: d.greens,
        losses: d.losses,
      }));
    }
    return [];
  }, [dailyStats]);

  const pieData = [
    { name: 'Trial', value: clientStats.trial, color: 'hsl(45, 93%, 58%)' },
    { name: 'Mensal', value: clientStats.monthly, color: 'hsl(187, 100%, 50%)' },
    { name: 'Anual', value: clientStats.annual, color: 'hsl(152, 69%, 55%)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Visão geral do sistema P-CON FLUX</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ExportImportBar
            onExportPDF={() => {
              const cols = [{ header: 'Métrica', key: 'metric' }, { header: 'Valor', key: 'value' }];
              const data = [
                { metric: 'Clientes Total', value: clientStats.total },
                { metric: 'Win Rate', value: `${winRate}%` },
                { metric: 'Padrões Ativos', value: activePatterns },
                { metric: 'Greens', value: signalStats.greens },
                { metric: 'Losses', value: signalStats.losses },
              ];
              exportToPDF('Dashboard - P-CON FLUX', cols, data, 'dashboard-pcon-flux');
              toast.success('PDF exportado com sucesso!');
            }}
            onExportExcel={() => {
              const cols = [{ header: 'Métrica', key: 'metric' }, { header: 'Valor', key: 'value' }];
              const data = [
                { metric: 'Clientes Total', value: clientStats.total },
                { metric: 'Win Rate %', value: winRate },
                { metric: 'Padrões Ativos', value: activePatterns },
                { metric: 'Greens', value: signalStats.greens },
                { metric: 'Losses', value: signalStats.losses },
              ];
              exportToExcel(cols, data, 'dashboard-pcon-flux', 'Dashboard');
              toast.success('Excel exportado com sucesso!');
            }}
            onImportFile={(file) => {
              importFromExcel(file, (rows) => {
                toast.success(`${rows.length} registros importados do arquivo!`);
              });
            }}
          />

          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border/30" style={{ background: 'hsla(240,6%,10%,0.8)' }}>
            {(['today', 'weekly', 'monthly'] as FilterType[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-semibold tracking-wider transition-all ${
                  filter === f ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}>
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => navigate('/admin/clients')}
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <Users size={18} className="text-primary" />
            <div className="flex items-center gap-0.5 text-primary">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-bold">+{clientStats.trial}</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{clientStats.total}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Clientes Total</p>
        </div>

        <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{winRate}%</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Win Rate Geral</p>
        </div>

        <div className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <Activity size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{activePatterns}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Padrões Ativos</p>
        </div>

        <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <Zap size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{signalStats.total}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Sinais Emitidos</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signal Performance Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Performance de Sinais</h3>
              <p className="text-[10px] text-muted-foreground/50">Greens vs Losses — dados reais</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400" /> {signalStats.greens} greens
              </span>
              <span className="flex items-center gap-1 text-[10px] text-secondary">
                <div className="w-2 h-2 rounded-full bg-secondary" /> {signalStats.losses} losses
              </span>
            </div>
          </div>
          {signalChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={signalChartData} barGap={2}>
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
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground/30 text-sm">
              Dados de performance diária serão exibidos aqui
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <h3 className="text-sm font-bold text-foreground mb-1">Distribuição de Planos</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-3">Clientes por tipo</p>
          {clientStats.total > 0 ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground/30 text-sm">Nenhum cliente cadastrado</div>
          )}
        </div>
      </div>

      {/* Plan Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
              <Zap size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">P-CON FLUX MENSAL</p>
              <p className="text-[10px] text-muted-foreground/50">{clientStats.monthly} assinantes ativos</p>
            </div>
            <p className="text-lg font-bold text-primary">{clientStats.monthly}</p>
          </div>

          <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center shadow-lg shadow-emerald-400/10">
              <Crown size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">P-CON FLUX ANUAL</p>
              <p className="text-[10px] text-muted-foreground/50">{clientStats.annual} assinantes ativos</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">{clientStats.annual}</p>
          </div>

          <div className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center shadow-lg shadow-amber-400/10">
              <Clock size={22} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Trial (3h Grátis)</p>
              <p className="text-[10px] text-muted-foreground/50">{clientStats.trial} em teste • {clientStats.expired} expirados</p>
            </div>
            <p className="text-lg font-bold text-amber-400">{clientStats.trial}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(152,69%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <BarChart3 size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Sinais — Greens</p>
              <p className="text-[10px] text-muted-foreground/50">Total de acertos registrados</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">{signalStats.greens}</p>
          </div>

          <div className="rounded-2xl p-4 border border-secondary/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center">
              <BarChart3 size={22} className="text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Sinais — Losses</p>
              <p className="text-[10px] text-muted-foreground/50">Total de erros registrados</p>
            </div>
            <p className="text-lg font-bold text-secondary">{signalStats.losses}</p>
          </div>

          <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Activity size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Padrões Ativos</p>
              <p className="text-[10px] text-muted-foreground/50">Padrões configurados e operando</p>
            </div>
            <p className="text-lg font-bold text-primary">{activePatterns}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button onClick={() => navigate('/admin/patterns')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-primary/25 text-primary flex items-center justify-center gap-2 hover:bg-primary/10"
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          Padrões <ArrowRight size={14} />
        </button>
        <button onClick={() => navigate('/admin/clients')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-emerald-500/25 text-emerald-400 flex items-center justify-center gap-2 hover:bg-emerald-500/10"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          Clientes <ArrowRight size={14} />
        </button>
        <button onClick={() => navigate('/admin/pattern-flow')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-secondary/25 text-secondary flex items-center justify-center gap-2 hover:bg-secondary/10 col-span-2 lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          Fluxo <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
