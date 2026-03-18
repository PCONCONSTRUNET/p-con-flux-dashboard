import { useState, useEffect } from 'react';
import { Zap, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { mockSignals, type Signal, type SignalResult } from '@/data/mockData';

const resultConfig: Record<SignalResult, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  green: { label: 'GREEN ✅', color: 'text-emerald-400', bg: 'border-emerald-500/30 bg-emerald-500/5', icon: CheckCircle },
  loss: { label: 'LOSS ❌', color: 'text-secondary', bg: 'border-secondary/30 bg-secondary/5', icon: XCircle },
  pending: { label: 'AGUARDANDO...', color: 'text-primary', bg: 'border-primary/30 bg-primary/5', icon: Loader2 },
};

const ClientDashboard = () => {
  const [signals, setSignals] = useState<Signal[]>(mockSignals);
  const [filter, setFilter] = useState<'all' | SignalResult>('all');

  const greens = signals.filter(s => s.result === 'green').length;
  const losses = signals.filter(s => s.result === 'loss').length;
  const pending = signals.filter(s => s.result === 'pending').length;
  const winRate = greens + losses > 0 ? Math.round((greens / (greens + losses)) * 100) : 0;

  const filtered = filter === 'all' ? signals : signals.filter(s => s.result === filter);

  // Simulate live signal arrival
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => prev.map(s =>
        s.result === 'pending' ? { ...s, result: Math.random() > 0.3 ? 'green' as const : 'loss' as const } : s
      ));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 glow-primary">
          <Zap size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground tracking-wide">Sinais Flux</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">Ao vivo</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-4 border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/40 to-transparent" />
          <TrendingUp size={16} className="text-emerald-400 mb-1" />
          <div className="text-2xl font-display font-bold text-emerald-400">{greens}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Greens</div>
        </div>
        <div className="rounded-xl p-4 border border-secondary/20 bg-secondary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-secondary/40 to-transparent" />
          <TrendingDown size={16} className="text-secondary mb-1" />
          <div className="text-2xl font-display font-bold text-secondary">{losses}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Losses</div>
        </div>
        <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/40 to-transparent" />
          <Clock size={16} className="text-primary mb-1" />
          <div className="text-2xl font-display font-bold text-primary">{pending}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Pendentes</div>
        </div>
        <div className="rounded-xl p-4 border border-foreground/10 bg-foreground/5 relative overflow-hidden col-span-2 lg:col-span-1">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-foreground/20 to-transparent" />
          <div className="text-2xl font-display font-bold text-foreground">{winRate}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Win Rate</div>
          {/* Mini bar */}
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${winRate}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'green', 'loss', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display tracking-wider whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-muted/50 text-muted-foreground border border-transparent hover:text-foreground'
            }`}
          >
            {f === 'all' ? 'TODOS' : f === 'green' ? '✅ GREEN' : f === 'loss' ? '❌ LOSS' : '⏳ PENDENTE'}
          </button>
        ))}
      </div>

      {/* Signals list */}
      <div className="space-y-2.5">
        {filtered.map((signal, idx) => {
          const cfg = resultConfig[signal.result];
          const Icon = cfg.icon;
          const time = new Date(signal.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={signal.id}
              className={`rounded-xl p-4 border ${cfg.bg} transition-all hover:scale-[1.01] relative overflow-hidden`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-display bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-md tracking-wider">{signal.type}</span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">{time}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{signal.entry}</div>
                  <div className="text-xs text-muted-foreground mt-1">Proteção: {signal.protection}</div>
                  {signal.rounds > 0 && (
                    <div className="text-[10px] text-muted-foreground/60 mt-1">
                      {signal.result === 'green' ? `Acertou em ${signal.rounds} rodada${signal.rounds > 1 ? 's' : ''}` : `${signal.rounds} tentativa${signal.rounds > 1 ? 's' : ''}`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Icon size={16} className={`${cfg.color} ${signal.result === 'pending' ? 'animate-spin' : ''}`} />
                  <span className={`text-xs font-display font-bold ${cfg.color}`}>{cfg.label}</span>
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
