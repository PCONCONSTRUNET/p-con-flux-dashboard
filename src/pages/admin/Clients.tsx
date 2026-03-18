import { useState, useEffect } from 'react';
import { Search, Users, Crown, Clock, Shield, ChevronRight, Calendar, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  plan: 'trial' | 'monthly' | 'annual';
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

const planConfig = {
  trial: { label: 'Teste Grátis', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Clock },
  monthly: { label: 'P-CON FLUX MENSAL', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: Zap },
  annual: { label: 'P-CON FLUX ANUAL', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: Crown },
};

const ClientsPage = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'trial' | 'monthly' | 'annual'>('all');
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [editPlan, setEditPlan] = useState<'trial' | 'monthly' | 'annual'>('trial');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, plan, started_at, expires_at, is_active');

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      setLoading(false);
      return;
    }

    const subsMap = new Map(subs?.map(s => [s.user_id, s]) || []);

    const merged: ClientData[] = (profiles || []).map(p => {
      const sub = subsMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        created_at: p.created_at,
        plan: (sub?.plan as ClientData['plan']) || 'trial',
        started_at: sub?.started_at || p.created_at,
        expires_at: sub?.expires_at || new Date().toISOString(),
        is_active: sub?.is_active ?? true,
      };
    });

    setClients(merged);
    setLoading(false);
  };

  const handleUpdatePlan = async () => {
    if (!editingClient) return;

    const now = new Date();
    let expiresAt: Date;
    if (editPlan === 'trial') {
      expiresAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    } else if (editPlan === 'monthly') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: editingClient.id,
        plan: editPlan,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        updated_at: now.toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating plan:', error);
      return;
    }

    setEditingClient(null);
    fetchClients();
  };

  const filtered = clients.filter(c => {
    if (planFilter !== 'all' && c.plan !== planFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const stats = {
    total: clients.length,
    trial: clients.filter(c => c.plan === 'trial').length,
    monthly: clients.filter(c => c.plan === 'monthly').length,
    annual: clients.filter(c => c.plan === 'annual').length,
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Gerencie os clientes e planos da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-muted-foreground/60" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold">Total</p>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="bg-amber-400/5 backdrop-blur-xl rounded-2xl p-4 border border-amber-400/20">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-amber-400/70" />
            <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">Trial</p>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.trial}</p>
        </div>
        <div className="bg-primary/5 backdrop-blur-xl rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-primary/70" />
            <p className="text-[10px] uppercase tracking-widest text-primary/70 font-semibold">Mensal</p>
          </div>
          <p className="text-2xl font-bold text-primary mt-1">{stats.monthly}</p>
        </div>
        <div className="bg-emerald-400/5 backdrop-blur-xl rounded-2xl p-4 border border-emerald-400/20">
          <div className="flex items-center gap-1.5">
            <Crown size={12} className="text-emerald-400/70" />
            <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-semibold">Anual</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.annual}</p>
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
            placeholder="Buscar clientes..."
            className="w-full bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'trial', 'monthly', 'annual'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPlanFilter(f)}
              className={`px-3 py-3 rounded-2xl text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
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

      {/* Client List */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando clientes...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={44} className="mx-auto mb-4 opacity-15" />
          <p className="text-sm font-medium">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(client => {
            const plan = planConfig[client.plan];
            const PlanIcon = plan.icon;
            const expired = isExpired(client.expires_at);
            const remaining = getTimeRemaining(client.expires_at);
            const createdDate = new Date(client.created_at);

            return (
              <div
                key={client.id}
                onClick={() => { setEditingClient(client); setEditPlan(client.plan); }}
                className={`rounded-2xl p-4 border backdrop-blur-sm transition-all duration-200 hover:scale-[1.003] cursor-pointer ${plan.border} ${plan.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl ${plan.bg} border ${plan.border} flex items-center justify-center`}>
                      <PlanIcon size={18} className={plan.color} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{client.name || 'Sem nome'}</p>
                      <p className="text-[11px] text-muted-foreground/50">{client.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-[10px] font-bold tracking-wider ${plan.color}`}>
                        {plan.label}
                      </span>
                      <p className={`text-[10px] mt-0.5 ${expired ? 'text-secondary font-bold' : 'text-muted-foreground/40'}`}>
                        {expired ? '⚠ Expirado' : `⏱ ${remaining}`}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground/20" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2.5 text-[10px] text-muted-foreground/40">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    Cadastro: {createdDate.toLocaleDateString('pt-BR')}
                  </span>
                  <span className="opacity-30">•</span>
                  <span>Expira: {new Date(client.expires_at).toLocaleDateString('pt-BR')} {new Date(client.expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingClient(null)}>
          <div className="w-full max-w-md bg-card/95 backdrop-blur-xl rounded-3xl p-6 border border-border/30 animate-fade-in shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-1">Alterar Plano</h3>
            <p className="text-xs text-muted-foreground/60 mb-5">{editingClient.name} — {editingClient.email}</p>

            <div className="space-y-2.5">
              {(['trial', 'monthly', 'annual'] as const).map(p => {
                const cfg = planConfig[p];
                const PIcon = cfg.icon;
                const isSelected = editPlan === p;
                const duration = p === 'trial' ? '3 horas' : p === 'monthly' ? '30 dias' : '365 dias';
                return (
                  <button
                    key={p}
                    onClick={() => setEditPlan(p)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left ${
                      isSelected
                        ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                        : 'border-border/20 bg-card/30 text-muted-foreground hover:border-border/40'
                    }`}
                  >
                    <PIcon size={20} className={isSelected ? cfg.color : 'text-muted-foreground/40'} />
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isSelected ? 'text-foreground' : ''}`}>{cfg.label}</p>
                      <p className="text-[10px] text-muted-foreground/50">{duration}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? `${cfg.border} ${cfg.bg}` : 'border-border/30'
                    }`}>
                      {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${cfg.color === 'text-amber-400' ? 'bg-amber-400' : cfg.color === 'text-primary' ? 'bg-primary' : 'bg-emerald-400'}`} />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setEditingClient(null)}
                className="flex-1 py-3 rounded-2xl border border-border/30 text-muted-foreground text-sm font-semibold hover:bg-muted/20 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePlan}
                className="flex-1 py-3 rounded-2xl bg-primary/20 border border-primary/30 text-primary text-sm font-bold hover:bg-primary/30 transition-all shadow-lg shadow-primary/10"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
