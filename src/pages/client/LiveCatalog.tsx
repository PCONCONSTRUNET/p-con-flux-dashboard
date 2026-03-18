import { useState, useMemo } from 'react';
import { Filter, Clock, RefreshCw, ChevronDown } from 'lucide-react';
import { mockBlazeRounds, type BlazeColor, type BlazeRound } from '@/data/mockData';
import blazeIcon from '@/assets/blaze-icon.png';

const colorMap: Record<BlazeColor, { bg: string; border: string; label: string }> = {
  red: { bg: 'bg-red-600', border: 'border-red-500/50', label: 'Vermelho' },
  black: { bg: 'bg-zinc-900', border: 'border-zinc-600/50', label: 'Preto' },
  white: { bg: 'bg-emerald-100', border: 'border-emerald-300/50', label: 'Branco' },
};

const roundLimits = [20, 50, 100, 200];

const LiveCatalog = () => {
  const [rounds] = useState<BlazeRound[]>(mockBlazeRounds);
  const [limit, setLimit] = useState(50);
  const [colorFilter, setColorFilter] = useState<BlazeColor | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const displayed = useMemo(() => {
    let data = rounds.slice(0, limit);
    if (colorFilter !== 'all') {
      data = data.filter(r => r.color === colorFilter);
    }
    return data;
  }, [rounds, limit, colorFilter]);

  const stats = useMemo(() => {
    const slice = rounds.slice(0, limit);
    return {
      red: slice.filter(r => r.color === 'red').length,
      black: slice.filter(r => r.color === 'black').length,
      white: slice.filter(r => r.color === 'white').length,
      total: slice.length,
    };
  }, [rounds, limit]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-secondary/10 border border-secondary/20">
            <img src={blazeIcon} alt="Blaze" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-display font-bold text-foreground tracking-wide">Double</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse-glow" />
              <span className="text-[10px] text-muted-foreground font-display tracking-widest uppercase">Tempo real</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${
              showFilters ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted/50 text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Color strip - last 20 results */}
      <div className="rounded-xl p-3 border border-border/50 bg-card/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-secondary/30 via-transparent to-primary/30" />
        <div className="text-[10px] text-muted-foreground font-display tracking-widest uppercase mb-2">Últimas rodadas</div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {rounds.slice(0, 30).map((r) => (
            <div
              key={r.id}
              className={`w-8 h-8 shrink-0 rounded-lg ${colorMap[r.color].bg} ${colorMap[r.color].border} border flex items-center justify-center text-[10px] font-bold ${r.color === 'white' ? 'text-zinc-800' : 'text-white'} transition-transform hover:scale-110`}
              title={`#${r.number} - ${r.roll} (${colorMap[r.color].label}) - ${new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            >
              {r.roll}
            </div>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl p-4 border border-border/50 bg-card/50 animate-slide-up space-y-4">
          <div>
            <div className="text-[10px] text-muted-foreground font-display tracking-widest uppercase mb-2">Quantidade de rodadas</div>
            <div className="flex gap-2">
              {roundLimits.map(l => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                    limit === l ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/50 text-muted-foreground border border-transparent'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-display tracking-widest uppercase mb-2">Filtrar por cor</div>
            <div className="flex gap-2">
              {(['all', 'red', 'black', 'white'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setColorFilter(c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition-all ${
                    colorFilter === c ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/50 text-muted-foreground border border-transparent'
                  }`}
                >
                  {c !== 'all' && <div className={`w-3 h-3 rounded ${colorMap[c].bg}`} />}
                  {c === 'all' ? 'TODAS' : colorMap[c].label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-3 border border-red-500/20 bg-red-500/5 text-center">
          <div className="text-lg font-display font-bold text-red-500">{stats.red}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Vermelho</div>
          <div className="text-[10px] text-red-400/60">{stats.total > 0 ? Math.round((stats.red / stats.total) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl p-3 border border-zinc-500/20 bg-zinc-500/5 text-center">
          <div className="text-lg font-display font-bold text-zinc-300">{stats.black}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Preto</div>
          <div className="text-[10px] text-zinc-400/60">{stats.total > 0 ? Math.round((stats.black / stats.total) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl p-3 border border-emerald-300/20 bg-emerald-100/5 text-center">
          <div className="text-lg font-display font-bold text-emerald-200">{stats.white}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Branco</div>
          <div className="text-[10px] text-emerald-300/60">{stats.total > 0 ? Math.round((stats.white / stats.total) * 100) : 0}%</div>
        </div>
      </div>

      {/* Rounds table */}
      <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <span className="text-[10px] font-display tracking-widest uppercase text-muted-foreground">
            Histórico — {displayed.length} rodada{displayed.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto">
          {displayed.map((r) => {
            const time = new Date(r.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${colorMap[r.color].bg} ${colorMap[r.color].border} border flex items-center justify-center text-xs font-bold ${r.color === 'white' ? 'text-zinc-800' : 'text-white'}`}>
                    {r.roll}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Rodada #{r.number}</div>
                    <div className="text-[10px] text-muted-foreground">{colorMap[r.color].label}</div>
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
    </div>
  );
};

export default LiveCatalog;
