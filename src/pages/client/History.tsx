import { useState } from 'react';
import { mockAlerts } from '@/data/mockData';
import { Search, Bell, Activity, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const statusConfig = {
  detected: { label: 'Detectado', color: 'text-secondary', icon: Bell },
  analyzing: { label: 'Analisando', color: 'text-primary', icon: Activity },
  resolved: { label: 'Resolvido', color: 'text-muted-foreground', icon: CheckCircle },
};

const History = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const filtered = mockAlerts.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.patternName.toLowerCase().includes(search.toLowerCase()) && !a.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = mockAlerts.find(a => a.id === selectedAlert);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-1">Registro completo de eventos detectados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            className="w-full bg-muted border border-border rounded-md pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'detected', 'analyzing', 'resolved'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-md text-xs font-display tracking-wider transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'all' ? 'TODOS' : s === 'detected' ? 'DETECTADOS' : s === 'analyzing' ? 'ANÁLISE' : 'RESOLVIDOS'}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum evento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(alert => {
            const cfg = statusConfig[alert.status];
            const Icon = cfg.icon;
            const date = new Date(alert.timestamp);
            return (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert.id)}
                className="w-full text-left card-glass rounded-lg p-4 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={cfg.color} />
                    <span className="font-semibold text-sm text-foreground">{alert.patternName}</span>
                  </div>
                  <span className={`text-xs font-display ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{alert.details}</p>
                <div className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                  {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedAlert(null)}>
          <div className="w-full max-w-md card-glass rounded-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-foreground mb-2">{selected.patternName}</h3>
            <span className={`text-xs font-display ${statusConfig[selected.status].color}`}>{statusConfig[selected.status].label}</span>
            <p className="text-sm text-muted-foreground mt-3">{selected.details}</p>
            <div className="text-xs text-muted-foreground/60 mt-3 font-mono">
              {new Date(selected.timestamp).toLocaleString('pt-BR')}
            </div>
            <button onClick={() => setSelectedAlert(null)} className="w-full mt-4 py-2.5 rounded-md bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
