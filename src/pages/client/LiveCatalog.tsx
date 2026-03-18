import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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

/* ── Reusable stone component ── */
const Stone = ({
  round,
  showNumbers,
  showTimestamps,
  dimmed,
  isSelected,
  onClick,
  formatTime,
  mobile,
}: {
  round: BlazeRound;
  showNumbers: boolean;
  showTimestamps: boolean;
  dimmed: boolean;
  isSelected: boolean;
  onClick: () => void;
  formatTime: (ts: string) => string;
  mobile?: boolean;
}) => {
  const style = colorStyles[round.color];
  const w = mobile ? 38 : 52;
  const h = mobile ? 58 : 78;
  const stoneH = mobile ? 36 : 50;
  const circleSize = mobile ? 'w-[22px] h-[22px]' : 'w-[30px] h-[30px]';
  const textSize = mobile ? 'text-[10px]' : 'text-xs';
  const timeSize = mobile ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className="flex flex-col items-center cursor-pointer" style={{ width: w, height: h }} onClick={onClick}>
      <div
        className={`w-full rounded-lg ${style.bg} ring-1 ${style.ring} flex items-center justify-center transition-all duration-200 ${
          dimmed ? 'opacity-20 scale-90' : 'opacity-100 active:scale-95 lg:hover:scale-110'
        } ${isSelected ? 'ring-primary ring-2 scale-110' : ''}`}
        style={{ height: stoneH }}
      >
        <div className={`${circleSize} rounded-full border-2 ${round.color === 'red' ? 'border-white/30' : round.color === 'white' ? 'border-[hsl(240_6%_30%)]/40' : 'border-white/15'} flex items-center justify-center`}>
          {showNumbers && <span className={`${textSize} font-bold ${style.text}`}>{round.roll}</span>}
        </div>
      </div>
      {showTimestamps && (
        <span className={`${timeSize} mt-0.5 font-sans font-bold tracking-tight bg-muted/30 px-1 py-0.5 rounded ${dimmed ? 'opacity-10' : 'text-muted-foreground'}`}>
          {formatTime(round.timestamp)}
        </span>
      )}
    </div>
  );
};

const LiveCatalog = () => {
  const [rounds, setRounds] = useState<BlazeRound[]>(mockBlazeRounds);
  const [limit, setLimit] = useState<number>(200);
  const [colorFilter, setColorFilter] = useState<BlazeColor | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
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
    if (colorFilter !== 'all') data = data.filter(r => r.color === colorFilter);
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

  const fixedGrid = useMemo(() => {
    const blockMap = new Map<string, { rounds: (BlazeRound | null)[][]; blockLabel: string }>();
    const ordered = [...fixedColumnSource].reverse();
    ordered.forEach((round) => {
      const d = new Date(round.timestamp);
      const minute = d.getMinutes();
      const digit = minute % 10;
      const blockStart = Math.floor(minute / 10) * 10;
      const hour = d.getHours();
      const blockKey = `${hour}-${blockStart}`;
      const blockLabel = `${String(hour).padStart(2, '0')}:${String(blockStart).padStart(2, '0')}`;
      if (!blockMap.has(blockKey)) {
        const emptyRow: (BlazeRound | null)[][] = Array.from({ length: 10 }, () => [null, null]);
        blockMap.set(blockKey, { rounds: emptyRow, blockLabel });
      }
      const block = blockMap.get(blockKey)!;
      const cell = block.rounds[digit];
      const emptyIdx = cell.indexOf(null);
      if (emptyIdx !== -1) cell[emptyIdx] = round;
    });
    return Array.from(blockMap.values()).reverse();
  }, [fixedColumnSource]);

  const handleClickRound = useCallback((round: BlazeRound) => {
    setHighlighted(prev => prev === round.id ? null : round.id);
  }, []);

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
    <div className="space-y-3 lg:space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="p-1 lg:p-1.5 rounded-xl bg-secondary/10 border border-secondary/20">
            <img src={blazeIcon} alt="Blaze" className="w-5 h-5 lg:w-6 lg:h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold text-foreground tracking-tight">Catalogador</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] lg:text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">
                Tempo real
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile clock inline */}
          <div className="lg:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/30 bg-card/60">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-primary">{clock}</span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl border transition-all ${
              showFilters ? 'bg-primary/10 text-primary border-primary/30' : 'bg-card/80 text-muted-foreground border-border/50 hover:text-foreground'
            }`}
          >
            <Filter size={12} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-2xl p-3 lg:p-4 border border-border/50 bg-card/80 backdrop-blur-sm animate-slide-up flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-3 lg:space-y-4">
            {/* Round limits */}
            <div className="flex flex-wrap gap-1.5 lg:gap-2">
              {ROUND_LIMITS.map(l => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                    limit === l ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent hover:text-foreground'
                  }`}
                >
                  {l} rodadas
                </button>
              ))}
            </div>

            {/* Color filter */}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Por cores</div>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                {COLOR_FILTERS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColorFilter(c)}
                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
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
            <div className="flex flex-wrap gap-x-4 lg:gap-x-5 gap-y-2">
              {[
                { checked: showTimestamps, onChange: () => setShowTimestamps(!showTimestamps), label: 'Horário' },
                { checked: showNumbers, onChange: () => setShowNumbers(!showNumbers), label: 'Numerado' },
                { checked: fixedColumns, onChange: () => setFixedColumns(!fixedColumns), label: 'Coluna fixa' },
              ].map(toggle => (
                <label key={toggle.label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={toggle.checked} onChange={toggle.onChange} className="sr-only peer" />
                  <div className="w-8 h-4 rounded-full bg-muted/50 peer-checked:bg-primary/30 relative transition-all">
                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${toggle.checked ? 'left-[18px] bg-primary' : 'left-0.5 bg-muted-foreground/50'}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{toggle.label}</span>
                </label>
              ))}
            </div>

            {/* Highlight mode */}
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">No clique, destacar</div>
              <div className="flex flex-wrap gap-1.5 lg:gap-2">
                <button
                  onClick={() => setHighlightMode('same_color')}
                  className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                    highlightMode === 'same_color' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
                  }`}
                >
                  Mesma cor
                </button>
                <button
                  onClick={() => setHighlightMode('same_number')}
                  className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold transition-all ${
                    highlightMode === 'same_number' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground border border-transparent'
                  }`}
                >
                  Mesmo número
                </button>
                {highlighted && (
                  <button
                    onClick={() => setHighlighted(null)}
                    className="px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-semibold bg-secondary/10 text-secondary border border-secondary/30"
                  >
                    <Trash2 size={12} className="inline mr-1" />
                    Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop clock card */}
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
      <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
        <div className="rounded-xl p-2 lg:p-2.5 border border-secondary/20 bg-secondary/5 text-center">
          <div className="text-sm lg:text-base font-bold text-secondary">{stats.red}</div>
          <div className="text-[8px] lg:text-[9px] text-muted-foreground uppercase tracking-wider">Vermelho</div>
          <div className="text-[8px] lg:text-[9px] text-secondary/50">{stats.total > 0 ? Math.round((stats.red / stats.total) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl p-2 lg:p-2.5 border border-border/30 bg-muted/10 text-center">
          <div className="text-sm lg:text-base font-bold text-muted-foreground">{stats.black}</div>
          <div className="text-[8px] lg:text-[9px] text-muted-foreground uppercase tracking-wider">Preto</div>
          <div className="text-[8px] lg:text-[9px] text-muted-foreground/50">{stats.total > 0 ? Math.round((stats.black / stats.total) * 100) : 0}%</div>
        </div>
        <div className="rounded-xl p-2 lg:p-2.5 border border-emerald-300/20 bg-emerald-100/5 text-center">
          <div className="text-sm lg:text-base font-bold text-emerald-200">{stats.white}</div>
          <div className="text-[8px] lg:text-[9px] text-muted-foreground uppercase tracking-wider">Branco</div>
          <div className="text-[8px] lg:text-[9px] text-emerald-300/50">{stats.total > 0 ? Math.round((stats.white / stats.total) * 100) : 0}%</div>
        </div>
      </div>

      {/* Histórico header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs lg:text-sm font-bold text-foreground">Histórico</h2>
          <span className="text-[9px] lg:text-[10px] text-muted-foreground">
            Exibindo <span className="text-primary font-bold">{fixedColumns ? fixedColumnSource.length : displayed.length}</span> rodadas
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <Clock size={12} />
          <span className="text-[10px] font-mono">{clock}</span>
        </div>
      </div>

      {fixedColumns ? (
        /* Fixed columns — scrollable on mobile */
        <div className="overflow-x-auto">
          {/* Header row — responsive column widths */}
          <div className="grid gap-1 lg:gap-2" style={{ gridTemplateColumns: 'repeat(10, minmax(80px, 108px))' }}>
            {Array.from({ length: 10 }, (_, col) => (
              <div key={`head-${col}`} className="text-center text-[10px] lg:text-[11px] font-bold text-muted-foreground/70 font-mono py-1 lg:py-1.5 border border-border/30 bg-muted/15">
                {String(col).padStart(2, '0')}
              </div>
            ))}
          </div>

          {fixedGrid.map((block, rowIdx) => (
            <div key={`block-${rowIdx}`} className="grid gap-1 lg:gap-2" style={{ gridTemplateColumns: 'repeat(10, minmax(80px, 108px))' }}>
              {block.rounds.map((cell, col) => (
                <div key={`cell-${rowIdx}-${col}`} className="flex gap-0.5 lg:gap-1 items-start justify-center">
                  {cell.map((r, slot) => {
                    if (!r) {
                      return (
                        <div key={`empty-${rowIdx}-${col}-${slot}`} className="w-[38px] lg:w-[52px]" style={{ height: '58px' }}>
                          <div className="w-full rounded-lg border border-border/20 bg-muted/8 h-[36px] lg:h-[50px]" />
                        </div>
                      );
                    }
                    const dimmed = !!(highlighted && !isHighlighted(r));
                    return (
                      <div key={r.id} className="hidden lg:block">
                        <Stone round={r} showNumbers={showNumbers} showTimestamps={showTimestamps} dimmed={dimmed} isSelected={r.id === highlighted} onClick={() => handleClickRound(r)} formatTime={formatTime} />
                      </div>
                    );
                  })}
                  {cell.map((r, slot) => {
                    if (!r) {
                      return (
                        <div key={`m-empty-${rowIdx}-${col}-${slot}`} className="lg:hidden w-[38px]" style={{ height: '58px' }}>
                          <div className="w-full rounded-lg border border-border/20 bg-muted/8 h-[36px]" />
                        </div>
                      );
                    }
                    const dimmed = !!(highlighted && !isHighlighted(r));
                    return (
                      <div key={`m-${r.id}`} className="lg:hidden">
                        <Stone round={r} showNumbers={showNumbers} showTimestamps={showTimestamps} dimmed={dimmed} isSelected={r.id === highlighted} onClick={() => handleClickRound(r)} formatTime={formatTime} mobile />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {fixedGrid.length === 0 && (
            <div className="grid gap-1 lg:gap-2" style={{ gridTemplateColumns: 'repeat(10, minmax(80px, 108px))' }}>
              {Array.from({ length: 10 }, (_, col) => (
                <div key={`empty-row-${col}`} className="flex gap-0.5 lg:gap-1 items-stretch">
                  <div className="rounded-lg border border-border/20 bg-muted/8 w-[38px] lg:w-[52px] h-[36px] lg:h-[50px]" />
                  <div className="rounded-lg border border-border/20 bg-muted/8 w-[38px] lg:w-[52px] h-[36px] lg:h-[50px]" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Grid view — responsive stones */
        <div className="overflow-x-auto">
          <div className="flex flex-wrap gap-0.5 lg:gap-1">
            {displayed.map((r) => {
              const dimmed = !!(highlighted && !isHighlighted(r));
              return (
                <div key={r.id}>
                  <div className="lg:hidden">
                    <Stone round={r} showNumbers={showNumbers} showTimestamps={showTimestamps} dimmed={dimmed} isSelected={r.id === highlighted} onClick={() => handleClickRound(r)} formatTime={formatTime} mobile />
                  </div>
                  <div className="hidden lg:block">
                    <Stone round={r} showNumbers={showNumbers} showTimestamps={showTimestamps} dimmed={dimmed} isSelected={r.id === highlighted} onClick={() => handleClickRound(r)} formatTime={formatTime} />
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

export default LiveCatalog;
