import { mockPatterns, mockAlerts, mockUsers } from '@/data/mockData';
import { Layers, Bell, Users, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const activePatterns = mockPatterns.filter(p => p.status === 'active').length;
  const todayAlerts = mockAlerts.length;
  const activeUsers = mockUsers.filter(u => u.status === 'active').length;

  const stats = [
    { label: 'Padrões Ativos', value: activePatterns, icon: Layers, color: 'text-primary', glowClass: 'glow-primary', borderColor: 'border-primary/20', path: '/admin/patterns' },
    { label: 'Eventos Hoje', value: todayAlerts, icon: Bell, color: 'text-secondary', glowClass: 'glow-secondary animate-pulse-glow', borderColor: 'border-secondary/20', path: '/admin/catalog' },
    { label: 'Usuários Ativos', value: activeUsers, icon: Users, color: 'text-primary', glowClass: 'glow-primary', borderColor: 'border-primary/20', path: '/admin/users' },
    { label: 'Total Padrões', value: mockPatterns.length, icon: Activity, color: 'text-foreground', glowClass: '', borderColor: 'border-border/50', path: '/admin/patterns' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground text-glow-primary">Dashboard Administrativo</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema P-CON FLUX</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className={`rounded-xl p-4 text-left hover:scale-[1.03] transition-all border ${stat.borderColor} ${stat.glowClass} backdrop-blur-sm relative overflow-hidden group`}
            style={{ background: 'linear-gradient(135deg, hsla(240, 6%, 10%, 0.8) 0%, hsla(240, 6%, 8%, 0.6) 100%)' }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, hsla(187, 100%, 50%, 0.05) 0%, transparent 100%)' }} />
            <stat.icon size={20} className={`${stat.color} mb-2 relative z-10`} />
            <div className={`text-2xl font-display font-bold ${stat.color} relative z-10`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1 relative z-10">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Recent alerts */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground tracking-wider uppercase mb-3">Eventos Recentes</h2>
        <div className="space-y-2">
          {mockAlerts.slice(0, 4).map(alert => {
            const time = new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={alert.id}
                className="rounded-xl p-3 flex items-center justify-between border border-border/30 backdrop-blur-sm hover:border-primary/20 transition-colors"
                style={{ background: 'linear-gradient(135deg, hsla(240, 6%, 10%, 0.6) 0%, hsla(240, 6%, 8%, 0.4) 100%)' }}
              >
                <div>
                  <span className="text-sm font-semibold text-foreground">{alert.patternName}</span>
                  <p className="text-xs text-muted-foreground line-clamp-1">{alert.details}</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-3">{time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-display font-semibold text-muted-foreground tracking-wider uppercase mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/admin/patterns')}
            className="py-3 rounded-xl font-display text-sm tracking-wider active:scale-[0.98] transition-all border border-primary/30 text-primary glow-primary flex items-center justify-center gap-2 hover:bg-primary/5"
            style={{ background: 'linear-gradient(135deg, hsla(187, 100%, 50%, 0.1) 0%, hsla(240, 6%, 8%, 0.8) 100%)' }}
          >
            GERENCIAR PADRÕES <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="py-3 rounded-xl font-display text-sm tracking-wider active:scale-[0.98] transition-all border border-secondary/30 text-secondary flex items-center justify-center gap-2 hover:bg-secondary/5"
            style={{ background: 'linear-gradient(135deg, hsla(345, 100%, 50%, 0.08) 0%, hsla(240, 6%, 8%, 0.8) 100%)' }}
          >
            GERENCIAR USUÁRIOS <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
