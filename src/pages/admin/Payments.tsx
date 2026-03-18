import { useState, useEffect, useMemo } from 'react';
import { Search, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Filter, CreditCard, CheckCircle2, XCircle, Clock, Crown, Zap, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface PaymentRecord {
  id: string;
  user_name: string;
  user_email: string;
  plan: 'trial' | 'monthly' | 'annual';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  amount: number;
  date: string;
  method: string;
}

// Mock payment data
const mockPayments: PaymentRecord[] = [
  { id: 'pay-1', user_name: 'Carlos Silva', user_email: 'carlos@empresa.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), method: 'PIX' },
  { id: 'pay-2', user_name: 'Ana Rodrigues', user_email: 'ana@empresa.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), method: 'Cartão' },
  { id: 'pay-3', user_name: 'Bruno Costa', user_email: 'bruno@startup.io', plan: 'monthly', status: 'failed', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), method: 'Cartão' },
  { id: 'pay-4', user_name: 'Mariana Santos', user_email: 'mariana@corp.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), method: 'PIX' },
  { id: 'pay-5', user_name: 'Lucas Pereira', user_email: 'lucas@email.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), method: 'Boleto' },
  { id: 'pay-6', user_name: 'Fernanda Lima', user_email: 'fernanda@email.com', plan: 'monthly', status: 'pending', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), method: 'Boleto' },
  { id: 'pay-7', user_name: 'Rafael Mendes', user_email: 'rafael@email.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), method: 'PIX' },
  { id: 'pay-8', user_name: 'Julia Almeida', user_email: 'julia@email.com', plan: 'monthly', status: 'refunded', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), method: 'Cartão' },
  { id: 'pay-9', user_name: 'Pedro Oliveira', user_email: 'pedro@email.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), method: 'PIX' },
  { id: 'pay-10', user_name: 'Camila Souza', user_email: 'camila@email.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), method: 'Cartão' },
];

const revenueByDay = [
  { day: 'Seg', value: 547 },
  { day: 'Ter', value: 497 },
  { day: 'Qua', value: 99 },
  { day: 'Qui', value: 547 },
  { day: 'Sex', value: 994 },
  { day: 'Sáb', value: 497 },
  { day: 'Dom', value: 149 },
];

const revenueByMethod = [
  { method: 'PIX', value: 1988, color: 'hsl(152, 69%, 55%)' },
  { method: 'Cartão', value: 1094, color: 'hsl(187, 100%, 50%)' },
  { method: 'Boleto', value: 249, color: 'hsl(45, 93%, 58%)' },
];

const statusConfig = {
  paid: { label: 'Pago', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
  pending: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Clock },
  failed: { label: 'Falhou', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20', icon: XCircle },
  refunded: { label: 'Reembolso', color: 'text-muted-foreground', bg: 'bg-muted/20', border: 'border-border/30', icon: ArrowDownRight },
};

const planConfig = {
  trial: { label: 'Trial', color: 'text-amber-400', icon: Clock },
  monthly: { label: 'Mensal', color: 'text-primary', icon: Zap },
  annual: { label: 'Anual', color: 'text-emerald-400', icon: Crown },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="border border-border/30 rounded-xl px-3 py-2 shadow-xl" style={{ background: 'hsl(240, 6%, 10%)' }}>
        <p className="text-[10px] text-muted-foreground/60 font-semibold mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-bold" style={{ color: p.color }}>
            R$ {p.value.toLocaleString('pt-BR')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PaymentsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [planFilter, setPlanFilter] = useState<'all' | 'monthly' | 'annual'>('all');

  const filtered = useMemo(() => {
    return mockPayments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (planFilter !== 'all' && p.plan !== planFilter) return false;
      if (search && !p.user_name.toLowerCase().includes(search.toLowerCase()) && !p.user_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter, planFilter]);

  const totalRevenue = mockPayments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const monthlyRevenue = mockPayments.filter(p => p.status === 'paid' && p.plan === 'monthly').reduce((a, p) => a + p.amount, 0);
  const annualRevenue = mockPayments.filter(p => p.status === 'paid' && p.plan === 'annual').reduce((a, p) => a + p.amount, 0);
  const pendingAmount = mockPayments.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const paidCount = mockPayments.filter(p => p.status === 'paid').length;
  const failedCount = mockPayments.filter(p => p.status === 'failed').length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Análise completa de receitas e assinaturas</p>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(152, 69%, 55%)' }} />
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={18} className="text-emerald-400" />
            <div className="flex items-center gap-0.5 text-emerald-400">
              <ArrowUpRight size={12} />
              <span className="text-[10px] font-bold">+18%</span>
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Receita Total</p>
        </div>

        <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(187, 100%, 50%)' }} />
          <div className="flex items-center justify-between mb-3">
            <Zap size={18} className="text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Receita Mensal</p>
        </div>

        <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(152, 69%, 55%)' }} />
          <div className="flex items-center justify-between mb-3">
            <Crown size={18} className="text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-foreground">R$ {annualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Receita Anual</p>
        </div>

        <div className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: 'hsl(45, 93%, 58%)' }} />
          <div className="flex items-center justify-between mb-3">
            <Clock size={18} className="text-amber-400" />
          </div>
          <p className="text-xl font-bold text-foreground">R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Pendente</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Receita por Dia</h3>
              <p className="text-[10px] text-muted-foreground/50">Últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
              <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-400" /> {paidCount} pagos</span>
              <span className="flex items-center gap-1"><XCircle size={10} className="text-secondary" /> {failedCount} falhas</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByDay}>
              <defs>
                <linearGradient id="payRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,6%,30%,0.2)" />
              <XAxis dataKey="day" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(240,6%,50%,0.1)' }} />
              <Area type="monotone" dataKey="value" name="Receita" stroke="hsl(152, 69%, 55%)" strokeWidth={2.5} fill="url(#payRevenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* By Method */}
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <h3 className="text-sm font-bold text-foreground mb-1">Por Método</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-4">Receita por forma de pagamento</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={revenueByMethod} layout="vertical" barSize={18}>
              <defs>
                {revenueByMethod.map((entry, i) => (
                  <linearGradient key={`mGrad-${i}`} id={`methodGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0.4} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis type="number" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
              <YAxis type="category" dataKey="method" tick={{ fill: 'hsla(240,6%,60%,0.7)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsla(240,6%,50%,0.1)' }} />
              <Bar dataKey="value" name="Receita" radius={[0, 6, 6, 0]}>
                {revenueByMethod.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={`url(#methodGrad-${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente..."
            className="w-full bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {(['all', 'paid', 'pending', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-3 rounded-2xl text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${
                statusFilter === f
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-card/40 text-muted-foreground/50 border border-border/20 hover:border-border/40'
              }`}
            >
              {f === 'all' ? 'TODOS' : f === 'paid' ? '✅ PAGOS' : f === 'pending' ? '⏳ PENDENTES' : '❌ FALHAS'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-2.5">
        {filtered.map(payment => {
          const sc = statusConfig[payment.status];
          const pc = planConfig[payment.plan];
          const StatusIcon = sc.icon;
          const PlanIcon = pc.icon;
          const date = new Date(payment.date);

          return (
            <div
              key={payment.id}
              className={`rounded-2xl p-4 border backdrop-blur-sm transition-all ${sc.border} ${sc.bg}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl ${sc.bg} border ${sc.border} flex items-center justify-center`}>
                    <StatusIcon size={18} className={sc.color} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{payment.user_name}</p>
                    <p className="text-[11px] text-muted-foreground/50">{payment.user_email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-bold ${payment.status === 'paid' ? 'text-emerald-400' : payment.status === 'failed' ? 'text-secondary' : 'text-foreground'}`}>
                    R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[9px] font-bold tracking-widest ${sc.color}`}>{sc.label.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-3 mt-2.5 text-[10px] text-muted-foreground/40">
                <span className={`flex items-center gap-1 ${pc.color}`}>
                  <PlanIcon size={10} />
                  {pc.label}
                </span>
                <span className="opacity-30">•</span>
                <span className="flex items-center gap-1">
                  <CreditCard size={10} />
                  {payment.method}
                </span>
                <span className="opacity-30">•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentsPage;
