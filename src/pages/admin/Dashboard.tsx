import { useEffect, useState } from 'react';
import { mockPatterns, mockAlerts, mockSignals } from '@/data/mockData';
import { Users, TrendingUp, Crown, Zap, Clock, DollarSign, Activity, ArrowRight, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// Revenue mock data (last 7 days)
const revenueData = [
{ day: 'Seg', revenue: 1200, clients: 3 },
{ day: 'Ter', revenue: 1800, clients: 5 },
{ day: 'Qua', revenue: 2400, clients: 4 },
{ day: 'Qui', revenue: 1600, clients: 6 },
{ day: 'Sex', revenue: 3200, clients: 8 },
{ day: 'Sáb', revenue: 2800, clients: 7 },
{ day: 'Dom', revenue: 2100, clients: 4 }];


// Signal performance data
const signalPerformanceData = [
{ hour: '00h', greens: 12, losses: 2 },
{ hour: '04h', greens: 8, losses: 3 },
{ hour: '08h', greens: 18, losses: 4 },
{ hour: '12h', greens: 24, losses: 5 },
{ hour: '16h', greens: 20, losses: 3 },
{ hour: '20h', greens: 15, losses: 2 }];


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
      </div>);

  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const activePatterns = mockPatterns.filter((p) => p.status === 'active').length;
  const greens = mockSignals.filter((s) => s.result === 'green').length;
  const losses = mockSignals.filter((s) => s.result === 'loss').length;
  const winRate = greens + losses > 0 ? Math.round(greens / (greens + losses) * 100) : 0;

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

  const totalRevenue = revenueData.reduce((acc, d) => acc + d.revenue, 0);
  const pieData = [
  { name: 'Trial', value: clientStats.trial || 2, color: 'hsl(45, 93%, 58%)' },
  { name: 'Mensal', value: clientStats.monthly || 5, color: 'hsl(187, 100%, 50%)' },
  { name: 'Anual', value: clientStats.annual || 3, color: 'hsl(152, 69%, 55%)' }];


  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Visão geral do sistema P-CON FLUX</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => navigate('/admin/clients')}
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(152, 69%, 55%)' }} />
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={18} className="text-emerald-400" />
            <div className="flex items-center gap-0.5 text-emerald-400">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-bold">+12%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Receita Semanal</p>
        </div>

        <div
          className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          onClick={() => navigate('/admin/clients')}
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          
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
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(152, 69%, 55%)' }} />
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{winRate}%</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Win Rate Geral</p>
        </div>

        <div
          className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all"
          style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          
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
        style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Receita Semanal</h3>
              <p className="text-[10px] text-muted-foreground/50">Últimos 7 dias</p>
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
              <XAxis dataKey="day" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(240,6%,50%,0.1)' }} />
              <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(187, 100%, 50%)" strokeWidth={2.5} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <h3 className="text-sm font-bold text-foreground mb-1">Distribuição de Planos</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-3">Clientes por tipo</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}>
                
                {pieData.map((entry, index) =>
                <Cell key={`cell-${index}`} fill={entry.color} />
                )}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((p) =>
            <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-[11px] text-muted-foreground/70">{p.name}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{p.value}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signal Performance */}
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Performance de Sinais</h3>
              <p className="text-[10px] text-muted-foreground/50">Greens vs Losses por período</p>
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
              <XAxis dataKey="hour" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
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
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
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
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
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
          style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
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
          style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center">
              <BarChart3 size={22} className="text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Sinais Hoje</p>
              <p className="text-[10px] text-muted-foreground/50">{greens} greens • {losses} losses</p>
            </div>
            <p className="text-lg font-bold text-foreground">{greens + losses}</p>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      





























      

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/admin/patterns')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-primary/25 text-primary flex items-center justify-center gap-2 hover:bg-primary/10"
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          
          Padrões <ArrowRight size={14} />
        </button>
        <button
          onClick={() => navigate('/admin/clients')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-emerald-500/25 text-emerald-400 flex items-center justify-center gap-2 hover:bg-emerald-500/10"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          
          Clientes <ArrowRight size={14} />
        </button>
        <button
          onClick={() => navigate('/admin/users')}
          className="py-3.5 rounded-2xl font-semibold text-sm tracking-wide transition-all border border-secondary/25 text-secondary flex items-center justify-center gap-2 hover:bg-secondary/10 col-span-2 lg:col-span-1"
          style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.08) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          
          Usuários <ArrowRight size={14} />
        </button>
      </div>
    </div>);

};

export default AdminDashboard;