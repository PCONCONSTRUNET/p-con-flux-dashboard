import { useState, useMemo } from 'react';
import { Search, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, CreditCard, CheckCircle2, XCircle, Clock, Crown, Zap, ChevronDown, Copy, Building2, Hash, Receipt, User, Mail, FileText, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import ExportImportBar from '@/components/ExportImportBar';
import { exportToPDF, exportToExcel, importFromExcel } from '@/utils/exportImport';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type FilterType = 'today' | 'weekly' | 'monthly' | 'custom';

interface PaymentRecord {
  id: string;
  user_name: string;
  user_email: string;
  plan: 'trial' | 'monthly' | 'annual';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  amount: number;
  date: string;
  method: string;
  transaction_id: string;
  bank: string;
  card_last4?: string;
  ip_address: string;
  currency: string;
  fee: number;
  net_amount: number;
  description: string;
}

// Mock payment data
const banks = ['Nubank', 'Itaú', 'Bradesco', 'Banco do Brasil', 'Santander', 'Inter', 'C6 Bank'];
const generateTxId = () => `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
const generateIP = () => `${Math.floor(Math.random()*200)+10}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

const mockPayments: PaymentRecord[] = [
  { id: 'pay-1', user_name: 'Carlos Silva', user_email: 'carlos@empresa.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), method: 'PIX', transaction_id: generateTxId(), bank: 'Nubank', ip_address: generateIP(), currency: 'BRL', fee: 4.97, net_amount: 492.03, description: 'Assinatura Anual - P-CON FLUX' },
  { id: 'pay-2', user_name: 'Ana Rodrigues', user_email: 'ana@empresa.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), method: 'Cartão', transaction_id: generateTxId(), bank: 'Itaú', card_last4: '4521', ip_address: generateIP(), currency: 'BRL', fee: 1.50, net_amount: 48.40, description: 'Assinatura Mensal - P-CON FLUX' },
  { id: 'pay-3', user_name: 'Bruno Costa', user_email: 'bruno@startup.io', plan: 'monthly', status: 'failed', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), method: 'Cartão', transaction_id: generateTxId(), bank: 'Bradesco', card_last4: '7890', ip_address: generateIP(), currency: 'BRL', fee: 0, net_amount: 0, description: 'Assinatura Mensal - P-CON FLUX (Falha)' },
  { id: 'pay-4', user_name: 'Mariana Santos', user_email: 'mariana@corp.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), method: 'PIX', transaction_id: generateTxId(), bank: 'Banco do Brasil', ip_address: generateIP(), currency: 'BRL', fee: 4.97, net_amount: 492.03, description: 'Assinatura Anual - P-CON FLUX' },
  { id: 'pay-5', user_name: 'Lucas Pereira', user_email: 'lucas@email.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), method: 'Boleto', transaction_id: generateTxId(), bank: 'Santander', ip_address: generateIP(), currency: 'BRL', fee: 2.50, net_amount: 47.40, description: 'Assinatura Mensal - P-CON FLUX' },
  { id: 'pay-6', user_name: 'Fernanda Lima', user_email: 'fernanda@email.com', plan: 'monthly', status: 'pending', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), method: 'Boleto', transaction_id: generateTxId(), bank: 'Inter', ip_address: generateIP(), currency: 'BRL', fee: 0, net_amount: 0, description: 'Assinatura Mensal - P-CON FLUX (Pendente)' },
  { id: 'pay-7', user_name: 'Rafael Mendes', user_email: 'rafael@email.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), method: 'PIX', transaction_id: generateTxId(), bank: 'C6 Bank', ip_address: generateIP(), currency: 'BRL', fee: 4.97, net_amount: 492.03, description: 'Assinatura Anual - P-CON FLUX' },
  { id: 'pay-8', user_name: 'Julia Almeida', user_email: 'julia@email.com', plan: 'monthly', status: 'refunded', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), method: 'Cartão', transaction_id: generateTxId(), bank: 'Nubank', card_last4: '3344', ip_address: generateIP(), currency: 'BRL', fee: 1.50, net_amount: -49.90, description: 'Assinatura Mensal - P-CON FLUX (Reembolso)' },
  { id: 'pay-9', user_name: 'Pedro Oliveira', user_email: 'pedro@email.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), method: 'PIX', transaction_id: generateTxId(), bank: 'Itaú', ip_address: generateIP(), currency: 'BRL', fee: 0.50, net_amount: 49.40, description: 'Assinatura Mensal - P-CON FLUX' },
  { id: 'pay-10', user_name: 'Camila Souza', user_email: 'camila@email.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), method: 'Cartão', transaction_id: generateTxId(), bank: 'Bradesco', card_last4: '1122', ip_address: generateIP(), currency: 'BRL', fee: 14.91, net_amount: 482.09, description: 'Assinatura Anual - P-CON FLUX' },
  { id: 'pay-11', user_name: 'Diego Ramos', user_email: 'diego@email.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), method: 'PIX', transaction_id: generateTxId(), bank: 'Nubank', ip_address: generateIP(), currency: 'BRL', fee: 0.50, net_amount: 49.40, description: 'Assinatura Mensal - P-CON FLUX' },
  { id: 'pay-12', user_name: 'Tatiana Gomes', user_email: 'tatiana@email.com', plan: 'annual', status: 'paid', amount: 497.00, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), method: 'Cartão', transaction_id: generateTxId(), bank: 'Santander', card_last4: '5566', ip_address: generateIP(), currency: 'BRL', fee: 14.91, net_amount: 482.09, description: 'Assinatura Anual - P-CON FLUX' },
  { id: 'pay-13', user_name: 'Marcos Dias', user_email: 'marcos@email.com', plan: 'monthly', status: 'paid', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), method: 'Boleto', transaction_id: generateTxId(), bank: 'Banco do Brasil', ip_address: generateIP(), currency: 'BRL', fee: 2.50, net_amount: 47.40, description: 'Assinatura Mensal - P-CON FLUX' },
  { id: 'pay-14', user_name: 'Patricia Nunes', user_email: 'patricia@email.com', plan: 'monthly', status: 'failed', amount: 49.90, date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(), method: 'Cartão', transaction_id: generateTxId(), bank: 'Inter', card_last4: '9988', ip_address: generateIP(), currency: 'BRL', fee: 0, net_amount: 0, description: 'Assinatura Mensal - P-CON FLUX (Falha)' },
];

const revenueDataSets: Record<Exclude<FilterType, 'custom'>, { label: string; value: number }[]> = {
  today: [
    { label: '06h', value: 150 },
    { label: '09h', value: 497 },
    { label: '12h', value: 99 },
    { label: '15h', value: 49 },
    { label: '18h', value: 0 },
    { label: '21h', value: 49 },
  ],
  weekly: [
    { label: 'Seg', value: 547 },
    { label: 'Ter', value: 497 },
    { label: 'Qua', value: 99 },
    { label: 'Qui', value: 547 },
    { label: 'Sex', value: 994 },
    { label: 'Sáb', value: 497 },
    { label: 'Dom', value: 149 },
  ],
  monthly: [
    { label: 'Sem 1', value: 2100 },
    { label: 'Sem 2', value: 1850 },
    { label: 'Sem 3', value: 2400 },
    { label: 'Sem 4', value: 3200 },
  ],
};

const revenueByMethod = [
  { method: 'PIX', value: 1988, color: 'hsl(152, 69%, 55%)' },
  { method: 'Cartão', value: 1094, color: 'hsl(187, 100%, 50%)' },
  { method: 'Boleto', value: 249, color: 'hsl(45, 93%, 58%)' },
];

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
  const [periodFilter, setPeriodFilter] = useState<FilterType>('weekly');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const activeFilter = periodFilter === 'custom' ? 'weekly' : periodFilter;
  const revenueData = revenueDataSets[activeFilter];

  // Filter payments by period
  const periodFilteredPayments = useMemo(() => {
    const now = new Date();
    return mockPayments.filter(p => {
      const pDate = new Date(p.date);
      if (periodFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return pDate >= startOfDay;
      }
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return pDate >= weekAgo;
      }
      if (periodFilter === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return pDate >= monthAgo;
      }
      if (periodFilter === 'custom' && customStart && customEnd) {
        const endOfDay = new Date(customEnd);
        endOfDay.setHours(23, 59, 59, 999);
        return pDate >= customStart && pDate <= endOfDay;
      }
      return true;
    });
  }, [periodFilter, customStart, customEnd]);

  const filtered = useMemo(() => {
    return periodFilteredPayments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search && !p.user_name.toLowerCase().includes(search.toLowerCase()) && !p.user_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, statusFilter, periodFilteredPayments]);

  const totalRevenue = periodFilteredPayments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const monthlyRevenue = periodFilteredPayments.filter(p => p.status === 'paid' && p.plan === 'monthly').reduce((a, p) => a + p.amount, 0);
  const annualRevenue = periodFilteredPayments.filter(p => p.status === 'paid' && p.plan === 'annual').reduce((a, p) => a + p.amount, 0);
  const pendingAmount = periodFilteredPayments.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const paidCount = periodFilteredPayments.filter(p => p.status === 'paid').length;
  const failedCount = periodFilteredPayments.filter(p => p.status === 'failed').length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header + Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Pagamentos</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Análise completa de receitas e assinaturas</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ExportImportBar
            onExportPDF={() => {
              const cols = [
                { header: 'Cliente', key: 'user_name' },
                { header: 'Email', key: 'user_email' },
                { header: 'Plano', key: 'plan' },
                { header: 'Valor', key: 'amount' },
                { header: 'Status', key: 'status' },
                { header: 'Método', key: 'method' },
                { header: 'Data', key: 'date' },
              ];
              const data = filtered.map(p => ({
                ...p,
                amount: `R$ ${p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                date: new Date(p.date).toLocaleDateString('pt-BR'),
                status: statusConfig[p.status].label,
              }));
              exportToPDF('Pagamentos - P-CON FLUX', cols, data, 'pagamentos-pcon-flux');
              toast.success('PDF exportado com sucesso!');
            }}
            onExportExcel={() => {
              const cols = [
                { header: 'Cliente', key: 'user_name' },
                { header: 'Email', key: 'user_email' },
                { header: 'Plano', key: 'plan' },
                { header: 'Valor', key: 'amount' },
                { header: 'Status', key: 'status' },
                { header: 'Método', key: 'method' },
                { header: 'Data', key: 'date' },
              ];
              const data = filtered.map(p => ({
                ...p,
                date: new Date(p.date).toLocaleDateString('pt-BR'),
                status: statusConfig[p.status].label,
              }));
              exportToExcel(cols, data, 'pagamentos-pcon-flux', 'Pagamentos');
              toast.success('Excel exportado com sucesso!');
            }}
            onImportFile={(file) => {
              importFromExcel(file, (rows) => {
                toast.success(`${rows.length} registros importados do arquivo!`);
                console.log('Imported payments:', rows);
              });
            }}
          />

          <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border/30" style={{ background: 'hsla(240,6%,10%,0.8)' }}>
            {(['today', 'weekly', 'monthly', 'custom'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setPeriodFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-semibold tracking-wider transition-all ${
                  periodFilter === f
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom date pickers */}
      {periodFilter === 'custom' && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/30" style={{ background: 'hsla(240,6%,10%,0.6)' }}>
          <CalendarIcon size={14} className="text-primary" />
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground font-display">DE:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 px-3 text-xs rounded-lg border-border/30 bg-muted/20", !customStart && "text-muted-foreground")}>
                  <CalendarIcon size={12} className="mr-1.5" />
                  {customStart ? format(customStart, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground font-display">ATÉ:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 px-3 text-xs rounded-lg border-border/30 bg-muted/20", !customEnd && "text-muted-foreground")}>
                  <CalendarIcon size={12} className="mr-1.5" />
                  {customEnd ? format(customEnd, "dd/MM/yyyy") : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

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
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Receita {filterLabels[periodFilter]}</p>
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
              <h3 className="text-sm font-bold text-foreground">Receita {filterLabels[periodFilter]}</h3>
              <p className="text-[10px] text-muted-foreground/50">{periodSubtitle[activeFilter]}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
              <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-400" /> {paidCount} pagos</span>
              <span className="flex items-center gap-1"><XCircle size={10} className="text-secondary" /> {failedCount} falhas</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="payRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(152, 69%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,6%,30%,0.2)" />
              <XAxis dataKey="label" tick={{ fill: 'hsla(240,6%,60%,0.5)', fontSize: 10 }} axisLine={false} tickLine={false} />
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

      {/* Status Filters + Search */}
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/40 text-sm">
            Nenhum pagamento encontrado para o período selecionado.
          </div>
        )}
        {filtered.map(payment => {
          const sc = statusConfig[payment.status];
          const pc = planConfig[payment.plan];
          const StatusIcon = sc.icon;
          const PlanIcon = pc.icon;
          const date = new Date(payment.date);

          return (
            <div
              key={payment.id}
              onClick={() => setSelectedPayment(payment)}
              className={`rounded-2xl p-4 border backdrop-blur-sm transition-all cursor-pointer hover:scale-[1.01] hover:shadow-lg ${sc.border} ${sc.bg}`}
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
                  <CalendarIcon size={10} />
                  {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md border-border/30 p-0 overflow-hidden" style={{ background: 'hsl(240, 6%, 10%)' }}>
          {selectedPayment && (() => {
            const sc = statusConfig[selectedPayment.status];
            const pc = planConfig[selectedPayment.plan];
            const StatusIcon = sc.icon;
            const date = new Date(selectedPayment.date);

            const copyToClipboard = (text: string) => {
              navigator.clipboard.writeText(text);
              toast.success('Copiado!');
            };

            const DetailRow = ({ icon: Icon, label, value, copyable }: { icon: any; label: string; value: string; copyable?: boolean }) => (
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5 text-muted-foreground/60">
                  <Icon size={13} />
                  <span className="text-[11px] font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold text-foreground">{value}</span>
                  {copyable && (
                    <button onClick={() => copyToClipboard(value)} className="p-1 rounded hover:bg-muted/30 transition-colors">
                      <Copy size={10} className="text-muted-foreground/40" />
                    </button>
                  )}
                </div>
              </div>
            );

            return (
              <>
                {/* Header with status */}
                <div className={`px-6 pt-6 pb-4 ${sc.bg} border-b ${sc.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} className="text-primary" />
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">Comprovante</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${sc.border} ${sc.bg}`}>
                      <StatusIcon size={12} className={sc.color} />
                      <span className={`text-[10px] font-bold tracking-wider ${sc.color}`}>{sc.label.toUpperCase()}</span>
                    </div>
                  </div>
                  <p className={`text-3xl font-bold ${selectedPayment.status === 'paid' ? 'text-emerald-400' : selectedPayment.status === 'failed' ? 'text-secondary' : 'text-foreground'}`}>
                    R$ {selectedPayment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1">{selectedPayment.description}</p>
                </div>

                {/* Details */}
                <div className="px-6 py-4 space-y-0">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2">Dados do Cliente</p>
                  <DetailRow icon={User} label="Nome" value={selectedPayment.user_name} />
                  <DetailRow icon={Mail} label="Email" value={selectedPayment.user_email} copyable />

                  <Separator className="my-2 bg-border/20" />

                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2 mt-3">Detalhes da Transação</p>
                  <DetailRow icon={Hash} label="ID Transação" value={selectedPayment.transaction_id} copyable />
                  <DetailRow icon={Building2} label="Banco" value={selectedPayment.bank} />
                  <DetailRow icon={CreditCard} label="Método" value={selectedPayment.card_last4 ? `${selectedPayment.method} •••• ${selectedPayment.card_last4}` : selectedPayment.method} />
                  <DetailRow icon={CalendarIcon} label="Data/Hora" value={`${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`} />
                  <DetailRow icon={Crown} label="Plano" value={pc.label} />

                  <Separator className="my-2 bg-border/20" />

                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2 mt-3">Valores</p>
                  <DetailRow icon={DollarSign} label="Valor Bruto" value={`R$ ${selectedPayment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <DetailRow icon={ArrowDownRight} label="Taxa" value={`- R$ ${selectedPayment.fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                  <div className="flex items-center justify-between py-2.5 border-t border-border/20 mt-1">
                    <span className="text-[11px] font-bold text-muted-foreground/60">Valor Líquido</span>
                    <span className="text-[13px] font-bold text-emerald-400">R$ {selectedPayment.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <Separator className="my-2 bg-border/20" />

                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2 mt-3">Segurança</p>
                  <DetailRow icon={Shield} label="IP de Origem" value={selectedPayment.ip_address} copyable />
                  <DetailRow icon={FileText} label="Moeda" value={selectedPayment.currency} />
                  <DetailRow icon={Hash} label="ID Pagamento" value={selectedPayment.id} copyable />
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
