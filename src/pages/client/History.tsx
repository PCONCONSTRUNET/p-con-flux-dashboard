import { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react';
import { type SignalResult, type Signal, type BlazeRound } from '@/data/mockData';
import { useSubscription } from '@/contexts/SubscriptionContext';
import LockedFeature from '@/components/LockedFeature';
import { supabase } from '@/integrations/supabase/client';
import { useBlazeDouble } from '@/hooks/useBlazeDouble';

const History = () => {
  const { hasActiveSubscription } = useSubscription();
  const { results: apiResults } = useBlazeDouble();
  const [tab, setTab] = useState<'signals' | 'rounds'>('signals');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | SignalResult>('all');
  const [allSignals, setAllSignals] = useState<Signal[]>([]);

  // Load all signals (including archived) from DB
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && data) {
        const mapped: Signal[] = data.map((s: any) => ({
          id: s.id,
          type: s.signal_type,
          entry: s.entry,
          protection: s.protection,
          result: s.result,
          timestamp: s.created_at,
          rounds: s.rounds,
          target: s.target,
        }));
        setAllSignals(mapped);
      }
    };
    load();
  }, []);

  const filteredSignals = useMemo(() => {
    return allSignals.filter(s => {
      if (resultFilter !== 'all' && s.result !== resultFilter) return false;
      if (search && !s.entry.toLowerCase().includes(search.toLowerCase()) && !s.type.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, resultFilter, allSignals]);

  const filteredRounds = useMemo(() => {
    return mockBlazeRounds.slice(0, 100);
  }, []);

  const greenCount = allSignals.filter(s => s.result === 'green').length;
  const lossCount = allSignals.filter(s => s.result === 'loss').length;
  const winRate = allSignals.length > 0 ? Math.round((greenCount / allSignals.length) * 100) : 0;

  if (!hasActiveSubscription) {
    return <LockedFeature feature="Histórico de sinais e rodadas" />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">
          Histórico
        </h1>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Registro completo de sinais e rodadas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">{allSignals.length}</p>
        </div>
        <div className="bg-emerald-500/10 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/20">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-display">Win Rate</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{winRate}%</p>
        </div>
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-4 border border-border/30">
          <div className="flex items-center gap-1">
            <TrendingUp size={10} className="text-primary" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display">Greens</p>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{greenCount}</p>
        </div>
      </div>

      {/* Tabs - iOS style segmented control */}
      <div className="flex p-1 rounded-2xl bg-muted/20 backdrop-blur-sm border border-border/30">
        <button
          onClick={() => setTab('signals')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
            tab === 'signals'
              ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10 border border-primary/25'
              : 'text-muted-foreground/60 hover:text-foreground'
          }`}
        >
          SINAIS
        </button>
        <button
          onClick={() => setTab('rounds')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
            tab === 'rounds'
              ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10 border border-primary/25'
              : 'text-muted-foreground/60 hover:text-foreground'
          }`}
        >
          RODADAS
        </button>
      </div>

      {tab === 'signals' && (
        <>
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar sinais..."
                className="w-full bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all duration-200"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'green', 'loss'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setResultFilter(f)}
                  className={`px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
                    resultFilter === f
                      ? f === 'green'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                        : f === 'loss'
                          ? 'bg-secondary/15 text-secondary border border-secondary/30 shadow-lg shadow-secondary/5'
                          : 'bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/5'
                      : 'bg-card/40 text-muted-foreground/50 border border-border/20 hover:border-border/40 hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? 'TODOS' : f === 'green' ? '✅ GREEN' : '✕ LOSS'}
                </button>
              ))}
            </div>
          </div>

          {/* Signal Cards */}
          {filteredSignals.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search size={44} className="mx-auto mb-4 opacity-15" />
              <p className="text-sm font-medium">Nenhum sinal encontrado</p>
              <p className="text-xs text-muted-foreground/40 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSignals.map(signal => {
                const isGreen = signal.result === 'green';
                const isLoss = signal.result === 'loss';
                const date = new Date(signal.timestamp);
                return (
                  <div
                    key={signal.id}
                    className={`rounded-2xl p-4 border backdrop-blur-sm transition-all duration-200 hover:scale-[1.005] ${
                      isGreen
                        ? 'border-emerald-500/15 bg-emerald-500/[0.03]'
                        : isLoss
                          ? 'border-secondary/15 bg-secondary/[0.03]'
                          : 'border-primary/15 bg-primary/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold bg-card/80 text-muted-foreground/70 px-2.5 py-1 rounded-lg tracking-wider uppercase">
                        {signal.type}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isGreen ? (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        ) : isLoss ? (
                          <XCircle size={15} className="text-secondary" />
                        ) : null}
                        <span className={`text-xs font-bold tracking-wide ${
                          isGreen ? 'text-emerald-400' : isLoss ? 'text-secondary' : 'text-primary'
                        }`}>
                          {isGreen ? 'GREEN' : isLoss ? 'LOSS' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                    <div className="text-[15px] font-bold text-foreground leading-snug">
                      {signal.entry}
                    </div>
                    <div className="flex items-center gap-2.5 mt-2 text-[11px] text-muted-foreground/50">
                      <span>{signal.protection}</span>
                      <span className="opacity-30">•</span>
                      <span className="font-mono">
                        {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'rounds' && (
        <div className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm overflow-hidden">
          <div className="divide-y divide-border/20">
            {filteredRounds.map(r => {
              const time = new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const colorConfig = {
                red: { bg: 'bg-red-600', text: 'text-white', glow: 'shadow-red-600/20' },
                black: { bg: 'bg-zinc-800', text: 'text-white', glow: 'shadow-zinc-800/20' },
                white: { bg: 'bg-emerald-100', text: 'text-zinc-800', glow: 'shadow-emerald-100/20' },
              };
              const c = colorConfig[r.color];
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/10 transition-colors duration-150">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center text-xs font-bold ${c.text} shadow-lg ${c.glow}`}>
                      {r.roll}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">#{r.number}</div>
                      <div className="text-[10px] text-muted-foreground/50 capitalize font-medium">
                        {r.color === 'white' ? 'Branco' : r.color === 'red' ? 'Vermelho' : 'Preto'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground/40">
                    <Clock size={12} />
                    <span className="text-[11px] font-mono">{time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
