import { Bell, Activity, CheckCircle } from 'lucide-react';
import { mockAlerts } from '@/data/mockData';

const statusConfig = {
  detected: { label: 'Detectado', color: 'text-secondary', bg: 'bg-secondary/10 border-secondary/20', icon: Bell },
  analyzing: { label: 'Analisando', color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: Activity },
  resolved: { label: 'Resolvido', color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: CheckCircle },
};

const ClientDashboard = () => {
  const recentAlerts = mockAlerts.slice(0, 6);
  const activeCount = mockAlerts.filter(a => a.status === 'detected').length;
  const analyzingCount = mockAlerts.filter(a => a.status === 'analyzing').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Alertas em Tempo Real</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitoramento ativo de padrões detectados</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="card-glow-secondary rounded-lg p-4 animate-pulse-glow">
          <div className="text-2xl font-display font-bold text-secondary">{activeCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Detectados</div>
        </div>
        <div className="card-glow-primary rounded-lg p-4">
          <div className="text-2xl font-display font-bold text-primary">{analyzingCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Em Análise</div>
        </div>
        <div className="card-glass rounded-lg p-4 col-span-2 lg:col-span-1">
          <div className="text-2xl font-display font-bold text-foreground">{mockAlerts.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Hoje</div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        <h2 className="text-sm font-display font-semibold text-muted-foreground tracking-wider uppercase">Eventos Recentes</h2>
        {recentAlerts.map(alert => {
          const cfg = statusConfig[alert.status];
          const Icon = cfg.icon;
          const time = new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={alert.id} className={`${cfg.bg} border rounded-lg p-4 transition-all hover:scale-[1.01]`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon size={18} className={`${cfg.color} mt-0.5 shrink-0`} />
                  <div>
                    <div className="font-semibold text-sm text-foreground">{alert.patternName}</div>
                    <div className="text-xs text-muted-foreground mt-1">{alert.details}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs font-display ${cfg.color}`}>{cfg.label}</span>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{time}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientDashboard;
