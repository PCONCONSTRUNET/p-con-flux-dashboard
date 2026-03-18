import { mockAlerts } from '@/data/mockData';
import { Bell, Activity, CheckCircle, RefreshCw } from 'lucide-react';

const statusConfig = {
  detected: { label: 'Detectado', color: 'text-secondary', icon: Bell },
  analyzing: { label: 'Analisando', color: 'text-primary', icon: Activity },
  resolved: { label: 'Resolvido', color: 'text-muted-foreground', icon: CheckCircle },
};

const LiveCatalog = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Catálogo Ao Vivo</h1>
          <p className="text-sm text-muted-foreground mt-1">Eventos detectados em tempo real</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-md hover:bg-primary/20 transition-colors">
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
        <span className="text-xs text-muted-foreground font-display tracking-wider">TRANSMISSÃO ATIVA</span>
      </div>

      <div className="space-y-2">
        {mockAlerts.map(alert => {
          const cfg = statusConfig[alert.status];
          const Icon = cfg.icon;
          const time = new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return (
            <div key={alert.id} className="card-glass rounded-lg p-4 hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={16} className={cfg.color} />
                  <span className="font-semibold text-sm text-foreground">{alert.patternName}</span>
                </div>
                <span className={`text-xs font-display ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{alert.details}</p>
              <div className="text-[10px] text-muted-foreground/60 mt-2 font-mono">{time}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveCatalog;
