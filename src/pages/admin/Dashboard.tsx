import { mockPatterns, mockAlerts, mockUsers } from '@/data/mockData';
import { Layers, Bell, Users, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const activePatterns = mockPatterns.filter(p => p.status === 'active').length;
  const todayAlerts = mockAlerts.length;
  const activeUsers = mockUsers.filter(u => u.status === 'active').length;

  const stats = [
    { label: 'Padrões Ativos', value: activePatterns, icon: Layers, color: 'text-primary', glow: 'glow-primary', path: '/admin/patterns' },
    { label: 'Eventos Hoje', value: todayAlerts, icon: Bell, color: 'text-secondary', glow: 'glow-secondary animate-pulse-glow', path: '/admin/catalog' },
    { label: 'Usuários Ativos', value: activeUsers, icon: Users, color: 'text-primary', glow: 'glow-primary', path: '/admin/users' },
    { label: 'Total Padrões', value: mockPatterns.length, icon: Activity, color: 'text-foreground', glow: '', path: '/admin/patterns' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard Administrativo</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do sistema P-CON FLUX</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <button
            key={stat.label}
            onClick={() => navigate(stat.path)}
            className={`card-glass ${stat.glow} rounded-lg p-4 text-left hover:scale-[1.02] transition-transform`}
          >
            <stat.icon size={20} className={`${stat.color} mb-2`} />
            <div className={`text-2xl font-display font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
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
              <div key={alert.id} className="card-glass rounded-lg p-3 flex items-center justify-between">
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
          <button onClick={() => navigate('/admin/patterns')} className="py-3 rounded-md bg-primary text-primary-foreground font-display text-sm tracking-wider hover:opacity-90 active:scale-[0.98] transition-all glow-primary">
            GERENCIAR PADRÕES
          </button>
          <button onClick={() => navigate('/admin/users')} className="py-3 rounded-md bg-muted text-foreground font-display text-sm tracking-wider hover:bg-muted/80 active:scale-[0.98] transition-all">
            GERENCIAR USUÁRIOS
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
