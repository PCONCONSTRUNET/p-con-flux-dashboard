import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { Filter, Clock, Trash2 } from 'lucide-react';
import { mockBlazeRounds, type BlazeColor, type BlazeRound } from '@/data/mockData';
import blazeIcon from '@/assets/blaze-icon.png';

const colorStyles: Record<BlazeColor, { bg: string; ring: string; text: string; label: string }> = {
  red: { bg: 'bg-secondary', ring: 'ring-secondary/40', text: 'text-white', label: 'Vermelho' },
  black: { bg: 'bg-[hsl(240_6%_15%)]', ring: 'ring-[hsl(240_6%_25%)]/40', text: 'text-muted-foreground', label: 'Preto' },
  white: { bg: 'bg-[hsl(0_0%_90%)]', ring: 'ring-[hsl(0_0%_80%)]/40', text: 'text-[hsl(240_6%_10%)]', label: 'Branco' },
};

const ROUND_LIMITS = [100, 200, 500] as const;
const COLOR_FILTERS = ['all', 'red', 'black', 'white'] as const;

const LiveCatalog = () => {
  const [rounds, setRounds] = useState<BlazeRound[]>(mockBlazeRounds);
  const [limit, setLimit] = useState<number>(200);
  const [colorFilter, setColorFilter] = useState<BlazeColor | 'all'>('all');
  const [showFilters, setShowFilters] = useState(true);
  
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [highlightMode, setHighlightMode] = useState<'same_number' | 'same_color'>('same_color');
  const [fixedColumns, setFixedColumns] = useState(false);
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate real-time incoming rounds — stable interval, no dependency on rounds
  const roundsRef = useRef(rounds);
  roundsRef.current = rounds;

  useEffect(() => {
    const interval = setInterval(() => {
      const roll = Math.floor(Math.random() * 15);
      let color: BlazeColor = 'black';
      if (roll === 0) color = 'white';
      else if (roll <= 7) color = 'red';

      const newRound: BlazeRound = {
        id: `br-rt-${Date.now()}`,
        number: roundsRef.current.length + 1,
        color,
        timestamp: new Date().toISOString(),
        roll,
      };
      setRounds(prev => [newRound, ...prev].slice(0, 600));
    }, 8000 + Math.random() * 12000);
    return () => clearInterval(interval);
  }, []);

  const displayed = useMemo(() => {
    let data = rounds.slice(0, limit);
    if (colorFilter !== 'all') {
      data = data.filter(r => r.color === colorFilter);
    }
    return data;
  }, [rounds, limit, colorFilter]);

  const stats = useMemo(() => {
    const slice = rounds.slice(0, limit);
    const total = slice.length;
    return {
      red: slice.filter(r => r.color === 'red').length,
      black: slice.filter(r => r.color === 'black').length,
      white: slice.filter(r => r.color === 'white').length,
      total,
    };
  }, [rounds, limit]);

  const fixedColumnSource = useMemo(() => {
    const sliced = rounds.slice(0, limit);
    if (colorFilter === 'all') return sliced;
    return sliced.filter((round) => round.color === colorFilter);
  }, [rounds, colorFilter, limit]);

  // Build grid: rows = 10-min blocks, cols = minute last digit (0-9), each cell = up to 2 rounds
  const fixedGrid = useMemo(() => {
    // Group by 10-minute block key and minute digit
    const blockMap = new Map<string, { rounds: (BlazeRound | null)[][]; blockLabel: string }>();

    const ordered = [...fixedColumnSource].reverse(); // oldest first
    ordered.forEach((round) => {
      const d = new Date(round.timestamp);
      const minute = d.getMinutes();
      const digit = minute % 10; // column 0-9
      const blockStart = Math.floor(minute / 10) * 10; // e.g., 0, 10, 20, 30, 40, 50
      const hour = d.getHours();
      const blockKey = `${hour}-${blockStart}`;
      const blockLabel = `${String(hour).padStart(2, '0')}:${String(blockStart).padStart(2, '0')}`;

      if (!blockMap.has(blockKey)) {
        // 10 columns, each with [null, null] (2 slots)
        const emptyRow: (BlazeRound | null)[][] = Array.from({ length: 10 }, () => [null, null]);
        blockMap.set(blockKey, { rounds: emptyRow, blockLabel });
      }

      const block = blockMap.get(blockKey)!;
      const cell = block.rounds[digit];
      // Fill first empty slot in this cell
      const emptyIdx = cell.indexOf(null);
      if (emptyIdx !== -1) {
        cell[emptyIdx] = round;
      }
    });

    // Convert to array, newest block first
    return Array.from(blockMap.values()).reverse();
  }, [fixedColumnSource]);

  const handleClickRound = useCallback((round: BlazeRound) => {
    if (highlighted === round.id) {
      setHighlighted(null);
    } else {
      setHighlighted(round.id);
    }
  }, [highlighted]);

  // Build a lookup map for highlighted target to avoid O(n) .find() per stone
  const highlightedTarget = useMemo(() => {
    if (!highlighted) return null;
    return rounds.find(r => r.id === highlighted) || null;
  }, [highlighted, rounds]);

  const isHighlighted = useCallback((round: BlazeRound) => {
    if (!highlightedTarget) return false;
    if (highlightMode === 'same_color') return round.color === highlightedTarget.color;
    return round.roll === highlightedTarget.roll;
  }, [highlightedTarget, highlightMode]);

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-xl bg-secondary/10 border border-secondary/20">
            <img src={blazeIcon} alt="Blaze" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Catalogador</h1>
             <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">
                Tempo real
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-3 py-2 rounded-xl border transition-all ${
            showFilters ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card/80 text-muted-foreground border-border/50 hover:text-foreground'
          }`}
        >
          <Filter size={12} />
          Filtros
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl p-4 border border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up flex gap-4">
          {/* Filter controls */}
          <div className="flex-1 space-y-4">
          {/* Quick filters row */}
          <div className="flex flex-wrap gap-2">
            {ROUND_LIMITS.map(l => (
              <button
                key={l}
                onClick={() => setLimit(l)}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                  limit === l ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent hover:text-foreground'
                }`}
              >
                {l} rodadas
              </button>
            ))}
          </div>

          {/* Color filter */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Por cores</div>
            <div className="flex gap-2">
              {COLOR_FILTERS.map(c => (
                <button
                  key={c}
                  onClick={() => setColorFilter(c)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                    colorFilter === c ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
                  }`}
                >
                  {c !== 'all' && <div className={`w-2.5 h-2.5 rounded-full ${colorStyles[c].bg}`} />}
                  {c === 'all' ? 'Todas' : colorStyles[c].label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTimestamps}
                onChange={() => setShowTimestamps(!showTimestamps)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 rounded-full bg-muted/50 peer-checked:bg-primary/30 relative transition-all">
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${showTimestamps ? 'left-[18px] bg-primary' : 'left-0.5 bg-muted-foreground/50'}`} />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Horário</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNumbers}
                onChange={() => setShowNumbers(!showNumbers)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 rounded-full bg-muted/50 peer-checked:bg-primary/30 relative transition-all">
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${showNumbers ? 'left-[18px] bg-primary' : 'left-0.5 bg-muted-foreground/50'}`} />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Numerado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fixedColumns}
                onChange={() => setFixedColumns(!fixedColumns)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 rounded-full bg-muted/50 peer-checked:bg-primary/30 relative transition-all">
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${fixedColumns ? 'left-[18px] bg-primary' : 'left-0.5 bg-muted-foreground/50'}`} />
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Coluna fixa</span>
            </label>
          </div>

          {/* Highlight mode */}
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">No clique, destacar</div>
            <div className="flex gap-2">
              <button
                onClick={() => setHighlightMode('same_color')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                  highlightMode === 'same_color' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
                }`}
              >
                Mesma cor
              </button>
              <button
                onClick={() => setHighlightMode('same_number')}
                className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                  highlightMode === 'same_number' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
                }`}
              >
                Mesmo número
              </button>
              {highlighted && (
                <button
                  onClick={() => setHighlighted(null)}
                  className="px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold bg-secondary/10 text-secondary border border-secondary/30"
                >
                  <Trash2 size={12} className="inline mr-1" />
                  Limpar
                </button>
              )}
            </div>
          </div>
          </div>

          {/* Clock card */}
          <div className="hidden lg:flex items-center self-stretch">
            <div
              className="w-[260px] h-full rounded-2xl flex flex-col justify-center relative cursor-pointer overflow-hidden transition-all duration-300 group"
              style={{
                background: 'linear-gradient(to right, hsl(240 6% 8%), hsl(210 40% 16%))',
                boxShadow: '5px 10px 50px rgba(0,0,0,0.5)',
              }}
            >
              <p className="text-[42px] font-bold text-foreground leading-none ml-4 mt-0">
                {clock.slice(0, 5)}
                <span className="text-[14px] ml-1.5 text-foreground/70">{clock.slice(6)}</span>
              </p>
              <p className="text-sm font-medium text-foreground/80 ml-4 mt-1">
                {new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" className="text-[18px] absolute right-3 top-3 text-foreground/60 transition-all duration-300 group-hover:text-[21px]">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                <path d="M10.794 3.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387a1.734 1.734 0 0 0-1.097 1.097l-.387 1.162a.217.217 0 0 1-.412 0l-.387-1.162A1.734 1.734 0 0 0 9.31 6.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387a1.734 1.734 0 0 0 1.097-1.097l.387-1.162zM13.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.156 1.156 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.156 1.156 0 0 0-.732-.732l-.774-.258a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732L13.863.1z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-2.5 border border-secondary/20 bg-secondary/5 text-center">
          <div className="text-base font-bold text-secondary">{stats.red}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Vermelho</div>
          <div className="text-[9px] text-secondary/50">{stats.total > 0 ? Math.round((stats.red / stats.total) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl p-2.5 border border-border/30 bg-muted/10 text-center">
          <div className="text-base font-bold text-muted-foreground">{stats.black}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Preto</div>
          <div className="text-[9px] text-muted-foreground/50">{stats.total > 0 ? Math.round((stats.black / stats.total) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl p-2.5 border border-emerald-300/20 bg-emerald-100/5 text-center">
          <div className="text-base font-bold text-emerald-200">{stats.white}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Branco</div>
          <div className="text-[9px] text-emerald-300/50">{stats.total > 0 ? Math.round((stats.white / stats.total) * 100) : 0}%</div>
        </div>
      </div>

      {/* Histórico header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Histórico</h2>
          <span className="text-[10px] text-muted-foreground">
            Exibindo <span className="text-primary font-bold">{fixedColumns ? fixedColumnSource.length : displayed.length}</span> rodadas
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <Clock size={12} />
          <span className="text-[10px] font-mono">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
      {fixedColumns ? (
        /* Fixed columns — horizontal grid: rows = 10-min blocks, cols = 00-09, 2 stones per cell */
        <div className="rounded-2xl border border-border/50 bg-card/50 p-3 overflow-auto max-h-[600px]">
          {/* Header row */}
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 108px)' }}>
            {Array.from({ length: 10 }, (_, col) => (
              <div key={`head-${col}`} className="text-center text-[11px] font-bold text-muted-foreground/70 font-mono py-1.5 border border-border/30 bg-muted/15">
                {String(col).padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Data rows — each row = 10-min block */}
          {fixedGrid.map((block, rowIdx) => (
            <div key={`block-${rowIdx}`} className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 108px)' }}>
              {block.rounds.map((cell, col) => (
                <div key={`cell-${rowIdx}-${col}`} className="flex gap-1 items-start justify-center">
                  {cell.map((r, slot) => {
                    if (!r) {
                      return (
                        <div key={`empty-${rowIdx}-${col}-${slot}`} style={{ width: '52px', height: '78px' }}>
                          <div className="w-full rounded-lg border border-border/20 bg-muted/8" style={{ height: '50px' }} />
                        </div>
                      );
                    }

                    const style = colorStyles[r.color];
                    const dimmed = highlighted && !isHighlighted(r);

                    return (
                      <div key={r.id} className="flex flex-col items-center" style={{ width: '52px', height: '78px' }}>
                        <div
                          onClick={() => handleClickRound(r)}
                          className={`w-full rounded-lg ${style.bg} ring-1 ${style.ring} flex items-center justify-center cursor-pointer transition-all duration-200 ${
                            dimmed ? 'opacity-20 scale-90' : 'opacity-100 hover:scale-110'
                          } ${r.id === highlighted ? 'ring-primary ring-2 scale-110' : ''}`}
                          style={{ height: '50px' }}
                        >
                          <div className={`w-[30px] h-[30px] rounded-full border-2 ${r.color === 'red' ? 'border-white/30' : r.color === 'white' ? 'border-[hsl(240_6%_30%)]/40' : 'border-white/15'} flex items-center justify-center`}>
                            {showNumbers && <span className={`text-xs font-bold ${style.text}`}>{r.roll}</span>}
                          </div>
                        </div>
                        {showTimestamps && (
                          <span className="text-[10px] font-sans font-bold text-muted-foreground tracking-tight leading-[16px] bg-muted/30 px-1.5 py-0.5 rounded mt-0.5">
                            {formatTime(r.timestamp)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* Empty pending row at top */}
          {fixedGrid.length === 0 && (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(10, 108px)' }}>
              {Array.from({ length: 10 }, (_, col) => (
                <div key={`empty-row-${col}`} className="flex gap-1 items-stretch">
                  <div className="rounded-lg border border-border/20 bg-muted/8" style={{ width: '52px', height: '50px' }} />
                  <div className="rounded-lg border border-border/20 bg-muted/8" style={{ width: '52px', height: '50px' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grid view — 22 per row */
        <div className="rounded-2xl border border-border/50 bg-card/50 p-3 overflow-y-auto max-h-[600px] overflow-x-auto">
          <div className="flex flex-wrap gap-1">
            {displayed.map((r) => {
              const style = colorStyles[r.color];
              const dimmed = highlighted && !isHighlighted(r);
              const time = formatTime(r.timestamp);
              return (
                <div
                  key={r.id}
                  onClick={() => handleClickRound(r)}
                  className="flex flex-col items-center cursor-pointer"
                  style={{ width: '52px', height: '78px' }}
                >
                  <div
                    className={`w-full rounded-lg ${style.bg} ring-1 ${style.ring} flex items-center justify-center transition-all duration-200 ${
                      dimmed ? 'opacity-20 scale-90' : 'opacity-100 hover:scale-110'
                    } ${r.id === highlighted ? 'ring-primary ring-2 scale-110' : ''}`}
                    style={{ height: '50px' }}
                  >
                    <div className={`w-[30px] h-[30px] rounded-full border-2 ${r.color === 'red' ? 'border-white/30' : r.color === 'white' ? 'border-[hsl(240_6%_30%)]/40' : 'border-white/15'} flex items-center justify-center`}>
                      {showNumbers && <span className={`text-xs font-bold ${style.text}`}>{r.roll}</span>}
                    </div>
                  </div>
                  {showTimestamps && (
                    <span className={`text-[10px] mt-0.5 font-sans font-bold tracking-tight transition-opacity bg-muted/30 px-1.5 py-0.5 rounded ${dimmed ? 'opacity-10' : 'text-muted-foreground'}`}>
                      {time}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
        </div>

        {/* Ad banner - outdoor de anúncios */}
        <div className="hidden lg:flex flex-col gap-3 w-[280px] shrink-0">
          <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden flex flex-col items-center justify-center h-[300px] relative group cursor-pointer transition-all hover:border-primary/30">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(240 6% 8%) 0%, hsl(210 40% 12%) 100%)' }} />
            <div className="relative z-10 flex flex-col items-center gap-3 p-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-2xl">📢</span>
              </div>
              <p className="text-sm font-bold text-foreground">Espaço Publicitário</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Anuncie aqui para milhares de usuários ativos</p>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 bg-primary/5">Anuncie Aqui</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/50 overflow-hidden flex flex-col items-center justify-center h-[280px] relative group cursor-pointer transition-all hover:border-secondary/30">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, hsl(240 6% 8%) 0%, hsl(345 40% 12%) 100%)' }} />
            <div className="relative z-10 flex flex-col items-center gap-3 p-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-sm font-bold text-foreground">Patrocinador</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">Destaque sua marca neste espaço premium</p>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary border border-secondary/30 rounded-lg px-3 py-1.5 bg-secondary/5">Saiba Mais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCatalog;
