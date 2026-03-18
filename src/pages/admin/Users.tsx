import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Power, X, Users, Crown, Zap, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name: string;
  email: string;
  created_at: string;
  plan: 'trial' | 'monthly' | 'annual';
  is_active: boolean;
}

const planConfig = {
  trial: { label: 'Trial', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
  monthly: { label: 'Mensal', color: 'text-primary', bg: 'bg-primary/10', icon: Zap },
  annual: { label: 'Anual', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Crown },
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: subs }] = await Promise.all([
      supabase.from('profiles').select('id, name, email, created_at'),
      supabase.from('subscriptions').select('user_id, plan, is_active'),
    ]);

    const subsMap = new Map(subs?.map(s => [s.user_id, s]) || []);

    const merged: UserData[] = (profiles || []).map(p => {
      const sub = subsMap.get(p.id);
      return {
        id: p.id,
        name: p.name || 'Sem nome',
        email: p.email,
        created_at: p.created_at,
        plan: (sub?.plan as UserData['plan']) || 'trial',
        is_active: sub?.is_active ?? true,
      };
    });

    setUsers(merged);
    setLoading(false);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Usuários cadastrados na plataforma</p>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuários..."
          className="w-full bg-card/40 border border-border/30 rounded-2xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground/50">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Carregando usuários...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={44} className="mx-auto mb-4 opacity-15" />
          <p className="text-sm font-medium">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-border/30 overflow-hidden backdrop-blur-xl" style={{ background: 'hsla(240,6%,10%,0.6)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left text-[10px] font-display text-muted-foreground/50 tracking-widest px-4 py-3">NOME</th>
                    <th className="text-left text-[10px] font-display text-muted-foreground/50 tracking-widest px-4 py-3">EMAIL</th>
                    <th className="text-left text-[10px] font-display text-muted-foreground/50 tracking-widest px-4 py-3">PLANO</th>
                    <th className="text-left text-[10px] font-display text-muted-foreground/50 tracking-widest px-4 py-3">STATUS</th>
                    <th className="text-left text-[10px] font-display text-muted-foreground/50 tracking-widest px-4 py-3">CADASTRO</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const plan = planConfig[u.plan];
                    const PlanIcon = plan.icon;
                    return (
                      <tr key={u.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 text-sm font-semibold text-foreground">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground/60">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-1 rounded-lg ${plan.bg} ${plan.color}`}>
                            <PlanIcon size={10} /> {plan.label.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-lg ${u.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-secondary/10 text-secondary'}`}>
                            {u.is_active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground/40">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {filtered.map(u => {
              const plan = planConfig[u.plan];
              const PlanIcon = plan.icon;
              return (
                <div key={u.id} className="rounded-2xl p-4 border border-border/20 backdrop-blur-sm" style={{ background: 'hsla(240,6%,10%,0.5)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-sm text-foreground">{u.name}</span>
                      <p className="text-[11px] text-muted-foreground/50">{u.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider px-2 py-1 rounded-lg ${plan.bg} ${plan.color}`}>
                      <PlanIcon size={10} /> {plan.label.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/40">
                    <span className={`font-bold ${u.is_active ? 'text-emerald-400' : 'text-secondary'}`}>
                      {u.is_active ? '● Ativo' : '● Inativo'}
                    </span>
                    <span>Cadastro: {new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default UsersPage;
