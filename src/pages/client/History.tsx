import { useState, useMemo } from 'react';
import { Search, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
import { mockSignals, mockBlazeRounds, type SignalResult } from '@/data/mockData';

const History = () => {
  const [tab, setTab] = useState<'signals' | 'rounds'>('signals');
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | SignalResult>('all');

  const filteredSignals = useMemo(() => {
    return mockSignals.filter(s => {
      if (resultFilter !== 'all' && s.result !== resultFilter) return false;
      if (search && !s.entry.toLowerCase().includes(search.toLowerCase()) && !s.type.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, resultFilter]);

  const filteredRounds = useMemo(() => {
    return mockBlazeRounds.slice(0, 100);
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground tracking-wide">Histórico</h1>
        <p className="text-xs text-muted-foreground mt-1">Registro completo de sinais e rodadas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/50">
        <button
          onClick={() => setTab('signals')}
          className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wider transition-all ${
            tab === 'signals' ? 'bg-primary/15 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          SINAIS
        </button>
        <button
          onClick={() => setTab('rounds')}
          className={`flex-1 py-2 rounded-lg text-xs font-display tracking-wider transition-all ${
            tab === 'rounds' ? 'bg-primary/15 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          RODADAS
        </button>
      </div>

      {tab === 'signals' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar sinais..."
                className="w-full bg-muted/30 border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {(['all', 'green', 'loss'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setResultFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-display tracking-wider whitespace-nowrap transition-all ${
                    resultFilter === f ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/50 text-muted-foreground border border-transparent'
                  }`}
                >
                  {f === 'all' ? 'TODOS' : f === 'green' ? '✅ GREEN' : '❌ LOSS'}
                </button>
              ))}
            </div>
          </div>

          {/* Signals list */}
          {filteredSignals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum sinal encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSignals.map(signal => {
                const isGreen = signal.result === 'green';
                const isLoss = signal.result === 'loss';
                const date = new Date(signal.timestamp);
                return (
                  <div
                    key={signal.id}
                    className={`rounded-xl p-4 border transition-all ${
                      isGreen ? 'border-emerald-500/20 bg-emerald-500/5' : isLoss ? 'border-secondary/20 bg-secondary/5' : 'border-primary/20 bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-display bg-muted/50 text-muted-foreground px-2 py-0.5 rounded tracking-wider">{signal.type}</span>
                      <div className="flex items-center gap-1">
                        {isGreen ? <CheckCircle size={14} className="text-emerald-400" /> : isLoss ? <XCircle size={14} className="text-secondary" /> : null}
                        <span className={`text-xs font-display font-bold ${isGreen ? 'text-emerald-400' : isLoss ? 'text-secondary' : 'text-primary'}`}>
                          {isGreen ? 'GREEN' : isLoss ? 'LOSS' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{signal.entry}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/60">
                      <span>{signal.protection}</span>
                      <span>•</span>
                      <span className="font-mono">{date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'rounds' && (
        <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
          <div className="divide-y divide-border/30 max-h-[500px] overflow-y-auto">
            {filteredRounds.map(r => {
              const time = new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const colorConfig = {
                red: { bg: 'bg-red-600', text: 'text-white' },
                black: { bg: 'bg-zinc-900', text: 'text-white' },
                white: { bg: 'bg-emerald-100', text: 'text-zinc-800' },
              };
              const c = colorConfig[r.color];
              return (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center text-xs font-bold ${c.text} border border-white/10`}>
                      {r.roll}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">#{r.number}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{r.color === 'white' ? 'Branco' : r.color === 'red' ? 'Vermelho' : 'Preto'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    <Clock size={12} />
                    <span className="text-xs font-mono">{time}</span>
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
