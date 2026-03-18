import { useState, useEffect, useMemo } from 'react';
import { Search, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar as CalendarIcon, CreditCard, CheckCircle2, XCircle, Clock, Crown, Zap, Copy, Hash, Receipt, User, Mail, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import ExportImportBar from '@/components/ExportImportBar';
import { exportToPDF, exportToExcel, importFromExcel } from '@/utils/exportImport';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type FilterType = 'today' | 'weekly' | 'monthly' | 'custom';

interface SubRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan: 'trial' | 'monthly' | 'annual';
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

const filterLabels: Record<FilterType, string> = {
  today: 'Hoje',
  weekly: 'Semanal',
  monthly: 'Mensal',
  custom: 'Personalizado',
};

const planConfig = {
  trial: { label: 'Trial', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Clock },
  monthly: { label: 'Mensal', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: Zap },
  annual: { label: 'Anual', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: Crown },
};

const PaymentsPage = () => {
  const [records, setRecords] = useState<SubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'trial' | 'monthly' | 'annual'>('all');
  const [periodFilter, setPeriodFilter] = useState<FilterType>('monthly');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [selectedRecord, setSelectedRecord] = useState<SubRecord | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: subs }] = await Promise.all([
      supabase.from('profiles').select('id, name, email'),
      supabase.from('subscriptions').select('id, user_id, plan, started_at, expires_at, is_active'),
    ]);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const merged: SubRecord[] = (subs || []).map(s => {
      const profile = profileMap.get(s.user_id);
      return {
        id: s.id,
        user_id: s.user_id,
        user_name: profile?.name || 'Sem nome',
        user_email: profile?.email || '',
        plan: s.plan as SubRecord['plan'],
        started_at: s.started_at,
        expires_at: s.expires_at,
        is_active: s.is_active,
      };
    });

    setRecords(merged);
    setLoading(false);
  };

  const periodFiltered = useMemo(() => {
    const now = new Date();
    return records.filter(r => {
      const d = new Date(r.started_at);
      if (periodFilter === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return d >= start;
      }
      if (periodFilter === 'weekly') {
        return d >= new Date(now.getTime() - 7 * 86400000);
      }
      if (periodFilter === 'monthly') {
        return d >= new Date(now.getTime() - 30 * 86400000);
      }
      if (periodFilter === 'custom' && customStart && customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return d >= customStart && d <= end;
      }
      return true;
    });
  }, [records, periodFilter, customStart, customEnd]);

  const filtered = useMemo(() => {
    return periodFiltered.filter(r => {
      if (planFilter !== 'all' && r.plan !== planFilter) return false;
      if (search && !r.user_name.toLowerCase().includes(search.toLowerCase()) && !r.user_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [periodFiltered, planFilter, search]);

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const stats = {
    total: periodFiltered.length,
    active: periodFiltered.filter(r => r.is_active && !isExpired(r.expires_at)).length,
    expired: periodFiltered.filter(r => isExpired(r.expires_at)).length,
    monthly: periodFiltered.filter(r => r.plan === 'monthly').length,
    annual: periodFiltered.filter(r => r.plan === 'annual').length,
    trial: periodFiltered.filter(r => r.plan === 'trial').length,
  };

  const pieData = [
    { name: 'Trial', value: stats.trial, color: 'hsl(45, 93%, 58%)' },
    { name: 'Mensal', value: stats.monthly, color: 'hsl(187, 100%, 50%)' },
    { name: 'Anual', value: stats.annual, color: 'hsl(152, 69%, 55%)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Assinaturas</h1>
          <p className="text-sm text-muted-foreground/70 mt-1">Visão geral das assinaturas da plataforma</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ExportImportBar
            onExportPDF={() => {
              const cols = [
                { header: 'Cliente', key: 'user_name' },
                { header: 'Email', key: 'user_email' },
                { header: 'Plano', key: 'plan' },
                { header: 'Status', key: 'status' },
                { header: 'Início', key: 'started' },
                { header: 'Expira', key: 'expires' },
              ];
              const data = filtered.map(r => ({
                user_name: r.user_name,
                user_email: r.user_email,
                plan: planConfig[r.plan].label,
                status: isExpired(r.expires_at) ? 'Expirado' : r.is_active ? 'Ativo' : 'Inativo',
                started: new Date(r.started_at).toLocaleDateString('pt-BR'),
                expires: new Date(r.expires_at).toLocaleDateString('pt-BR'),
              }));
              exportToPDF('Assinaturas - P-CON FLUX', cols, data, 'assinaturas-pcon-flux');
              toast.success('PDF exportado com sucesso!');
            }}
            onExportExcel={() => {
              const cols = [
                { header: 'Cliente', key: 'user_name' },
                { header: 'Email', key: 'user_email' },
                { header: 'Plano', key: 'plan' },
                { header: 'Status', key: 'status' },
                { header: 'Início', key: 'started' },
                { header: 'Expira', key: 'expires' },
              ];
              const data = filtered.map(r => ({
                user_name: r.user_name,
                user_email: r.user_email,
                plan: planConfig[r.plan].label,
                status: isExpired(r.expires_at) ? 'Expirado' : r.is_active ? 'Ativo' : 'Inativo',
                started: new Date(r.started_at).toLocaleDateString('pt-BR'),
                expires: new Date(r.expires_at).toLocaleDateString('pt-BR'),
              }));
              exportToExcel(cols, data, 'assinaturas-pcon-flux', 'Assinaturas');
              toast.success('Excel exportado com sucesso!');
            }}
            onImportFile={(file) => {
              importFromExcel(file, (rows) => {
                toast.success(`${rows.length} registros importados!`);
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Total Assinaturas</p>
        </div>

        <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.active}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Ativos</p>
        </div>

        <div className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <Clock size={18} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.trial}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Trial</p>
        </div>

        <div className="rounded-2xl p-4 border border-secondary/20 backdrop-blur-xl relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, hsla(345,100%,50%,0.08) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
          <div className="flex items-center justify-between mb-3">
            <XCircle size={18} className="text-secondary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mt-1">Expirados</p>
        </div>
      </div>

      {/* Chart + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 border border-border/30 backdrop-blur-xl"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.6) 0%, hsla(240,6%,8%,0.8) 100%)' }}>
          <h3 className="text-sm font-bold text-foreground mb-1">Distribuição por Plano</h3>
          <p className="text-[10px] text-muted-foreground/50 mb-3">Assinaturas por tipo</p>
          {stats.total > 0 ? (
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
            <div className="flex items-center justify-center h-[200px] text-muted-foreground/30 text-sm">Nenhuma assinatura</div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          {/* Plan stats */}
          <div className="rounded-2xl p-4 border border-primary/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Zap size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">P-CON FLUX MENSAL</p>
              <p className="text-[10px] text-muted-foreground/50">{stats.monthly} assinantes</p>
            </div>
            <p className="text-lg font-bold text-primary">{stats.monthly}</p>
          </div>

          <div className="rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(152,69%,55%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
              <Crown size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">P-CON FLUX ANUAL</p>
              <p className="text-[10px] text-muted-foreground/50">{stats.annual} assinantes</p>
            </div>
            <p className="text-lg font-bold text-emerald-400">{stats.annual}</p>
          </div>

          <div className="rounded-2xl p-4 border border-amber-400/20 backdrop-blur-xl flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, hsla(45,93%,58%,0.06) 0%, hsla(240,6%,8%,0.9) 100%)' }}>
            <div className="w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
              <Clock size={22} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Trial (3h Grátis)</p>
              <p className="text-[10px] text-muted-foreground/50">{stats.trial} em teste</p>
            </div>
            <p className="text-lg font-bold text-amber-400">{stats.trial}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
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
          {(['all', 'trial', 'monthly', 'annual'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPlanFilter(f)}
              className={`px-3 py-3 rounded-2xl text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${
                planFilter === f
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-card/40 text-muted-foreground/50 border border-border/20 hover:border-border/40'
              }`}
            >
              {f === 'all' ? 'TODOS' : f === 'trial' ? 'TRIAL' : f === 'monthly' ? 'MENSAL' : 'ANUAL'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando assinaturas...</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground/40 text-sm">
              Nenhuma assinatura encontrada.
            </div>
          )}
          {filtered.map(record => {
            const pc = planConfig[record.plan];
            const PlanIcon = pc.icon;
            const expired = isExpired(record.expires_at);
            const startDate = new Date(record.started_at);
            const expDate = new Date(record.expires_at);

            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className={`rounded-2xl p-4 border backdrop-blur-sm transition-all cursor-pointer hover:scale-[1.003] ${pc.border} ${pc.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl ${pc.bg} border ${pc.border} flex items-center justify-center`}>
                      <PlanIcon size={18} className={pc.color} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{record.user_name}</p>
                      <p className="text-[11px] text-muted-foreground/50">{record.user_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold tracking-wider ${pc.color}`}>{pc.label.toUpperCase()}</span>
                    <p className={`text-[10px] mt-0.5 ${expired ? 'text-secondary font-bold' : 'text-emerald-400'}`}>
                      {expired ? '⚠ Expirado' : '✓ Ativo'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-3 mt-2.5 text-[10px] text-muted-foreground/40">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={10} />
                    Início: {startDate.toLocaleDateString('pt-BR')}
                  </span>
                  <span className="opacity-30">•</span>
                  <span>Expira: {expDate.toLocaleDateString('pt-BR')} {expDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="sm:max-w-md border-border/30 p-0 overflow-hidden" style={{ background: 'hsl(240, 6%, 10%)' }}>
          {selectedRecord && (() => {
            const pc = planConfig[selectedRecord.plan];
            const PlanIcon = pc.icon;
            const expired = isExpired(selectedRecord.expires_at);

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
                <div className={`px-6 pt-6 pb-4 ${pc.bg} border-b ${pc.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} className="text-primary" />
                      <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">Detalhes da Assinatura</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${expired ? 'border-secondary/30 bg-secondary/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                      <span className={`text-[10px] font-bold tracking-wider ${expired ? 'text-secondary' : 'text-emerald-400'}`}>
                        {expired ? 'EXPIRADO' : 'ATIVO'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlanIcon size={20} className={pc.color} />
                    <p className={`text-xl font-bold ${pc.color}`}>{pc.label.toUpperCase()}</p>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-0">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2">Cliente</p>
                  <DetailRow icon={User} label="Nome" value={selectedRecord.user_name} />
                  <DetailRow icon={Mail} label="Email" value={selectedRecord.user_email} copyable />

                  <Separator className="my-2 bg-border/20" />

                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase mb-2 mt-3">Assinatura</p>
                  <DetailRow icon={Hash} label="ID" value={selectedRecord.id} copyable />
                  <DetailRow icon={Crown} label="Plano" value={pc.label} />
                  <DetailRow icon={CalendarIcon} label="Início" value={new Date(selectedRecord.started_at).toLocaleDateString('pt-BR')} />
                  <DetailRow icon={CalendarIcon} label="Expira" value={`${new Date(selectedRecord.expires_at).toLocaleDateString('pt-BR')} ${new Date(selectedRecord.expires_at).toLocaleTimeString('pt-BR')}`} />
                  <DetailRow icon={Shield} label="Status" value={expired ? 'Expirado' : selectedRecord.is_active ? 'Ativo' : 'Inativo'} />
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
