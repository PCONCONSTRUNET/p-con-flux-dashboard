import { useState, useEffect } from 'react';
import { Zap, Trophy, XCircle, Percent, ChevronDown, ExternalLink, Loader2, CheckCircle2, Radio } from 'lucide-react';
import { mockSignals, type Signal } from '@/data/mockData';
import flameIcon from '@/assets/flame-icon.png';

type AnalysisState = 'scanning' | 'pattern_found' | 'confirmed' | 'idle';

const stateLabels: Record<AnalysisState, string> = {
  scanning: 'Analisando padrões...',
  pattern_found: 'Padrão detectado!',
  confirmed: '🔥 Entrada confirmada!',
  idle: 'Aguardando análise...',
};

const ClientDashboard = () => {
  const [maxGale, setMaxGale] = useState(1);
  const [minAssert, setMinAssert] = useState(95);
  const [signals, setSignals] = useState<Signal[]>(mockSignals.filter(s => s.result !== 'pending'));
  const [analysisState, setAnalysisState] = useState<AnalysisState>('scanning');
  const [currentEntry, setCurrentEntry] = useState<string | null>(null);
  const [showGaleDropdown, setShowGaleDropdown] = useState(false);
  const [showAssertDropdown, setShowAssertDropdown] = useState(false);

  const greens = signals.filter(s => s.result === 'green').length;
  const losses = signals.filter(s => s.result === 'loss').length;
  const assertRate = greens + losses > 0 ? Math.round((greens / (greens + losses)) * 100) : 100;

  // Simulate real-time analysis cycle
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const cycle = () => {
      // Phase 1: Scanning
      setAnalysisState('scanning');
      setCurrentEntry(null);

      const scanDuration = 6000 + Math.random() * 8000;

      timeout = setTimeout(() => {
        // Phase 2: Pattern found
        const entries = ['3x Vermelho → Preto', '2x Preto → Vermelho', '4x Vermelho → Preto', '5x Preto → Vermelho', '3x Preto → Branco'];
        const entry = entries[Math.floor(Math.random() * entries.length)];
        setCurrentEntry(entry);
        setAnalysisState('pattern_found');

        timeout = setTimeout(() => {
          // Phase 3: Confirmed
          setAnalysisState('confirmed');

          timeout = setTimeout(() => {
            // Phase 4: Resolve and add to history
            const isGreen = Math.random() > 0.25;
            const newSignal: Signal = {
              id: `s-${Date.now()}`,
              type: 'Auto',
              entry,
              protection: `${maxGale} Gale${maxGale > 1 ? 's' : ''}`,
              result: isGreen ? 'green' : 'loss',
              timestamp: new Date().toISOString(),
              rounds: Math.ceil(Math.random() * (maxGale + 1)),
              target: 'Double',
            };
            setSignals(prev => [newSignal, ...prev]);
            setAnalysisState('idle');

            // Restart cycle
            timeout = setTimeout(cycle, 2000);
          }, 3000);
        }, 2000);
      }, scanDuration);
    };

    cycle();
    return () => clearTimeout(timeout);
  }, [maxGale]);

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={flameIcon} alt="" className="w-7 h-7" />
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            SINAIS <span className="text-primary">FLUX</span>
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Online</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        {/* Max Gale */}
        <div className="relative">
          <button
            onClick={() => { setShowGaleDropdown(!showGaleDropdown); setShowAssertDropdown(false); }}
            className="w-full rounded-2xl p-3.5 border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col items-center gap-1 active:scale-[0.97] transition-all"
          >
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Max Gale</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-foreground">{maxGale}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </button>
          {showGaleDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden animate-slide-up">
              {[0, 1, 2, 3].map(g => (
                <button key={g} onClick={() => { setMaxGale(g); setShowGaleDropdown(false); }}
                  className={`w-full py-2.5 text-sm text-center transition-colors ${maxGale === g ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                >{g}</button>
              ))}
            </div>
          )}
        </div>

        {/* Filter Assert */}
        <div className="relative">
          <button
            onClick={() => { setShowAssertDropdown(!showAssertDropdown); setShowGaleDropdown(false); }}
            className="w-full rounded-2xl p-3.5 border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col items-center gap-1 active:scale-[0.97] transition-all"
          >
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Filtro Assert.</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-foreground">{minAssert}%</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </button>
          {showAssertDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden animate-slide-up">
              {[80, 85, 90, 95, 100].map(a => (
                <button key={a} onClick={() => { setMinAssert(a); setShowAssertDropdown(false); }}
                  className={`w-full py-2.5 text-sm text-center transition-colors ${minAssert === a ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
                >{a}%</button>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-3.5 border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col items-center">
          <Trophy size={18} className="text-emerald-400 mb-1" />
          <span className="text-xl font-bold text-foreground">{greens}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Wins</span>
        </div>
        <div className="rounded-2xl p-3.5 border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col items-center">
          <XCircle size={18} className="text-secondary mb-1" />
          <span className="text-xl font-bold text-foreground">{losses}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Losses</span>
        </div>
        <div className="rounded-2xl p-3.5 border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col items-center">
          <Percent size={18} className="text-primary mb-1" />
          <span className="text-xl font-bold text-foreground">{assertRate}%</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Assert.</span>
        </div>
      </div>

      {/* Analysis area */}
      <div className="rounded-3xl p-6 border border-border/50 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.9) 0%, hsla(240,6%,8%,0.95) 100%)' }}>
        
        {/* Top accent */}
        <div className={`absolute top-0 left-1/4 right-1/4 h-1 rounded-b-full transition-all duration-700 ${
          analysisState === 'confirmed' ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' :
          analysisState === 'pattern_found' ? 'bg-gradient-to-r from-transparent via-primary to-transparent' :
          'bg-gradient-to-r from-transparent via-secondary/60 to-transparent'
        }`} />

        {/* Circle */}
        <div className="flex justify-center mb-4">
          <div className={`w-28 h-28 rounded-full border-[3px] flex items-center justify-center transition-all duration-500 ${
            analysisState === 'scanning'
              ? 'border-muted-foreground/20 animate-pulse'
              : analysisState === 'pattern_found'
                ? 'border-primary/50 shadow-[0_0_30px_hsla(187,100%,50%,0.2)]'
                : analysisState === 'confirmed'
                  ? 'border-emerald-500/50 shadow-[0_0_40px_hsla(145,80%,50%,0.25)]'
                  : 'border-border/30'
          }`}>
            {analysisState === 'scanning' ? (
              <Radio size={36} className="text-muted-foreground animate-pulse" />
            ) : analysisState === 'pattern_found' ? (
              <Zap size={36} className="text-primary" />
            ) : analysisState === 'confirmed' ? (
              <CheckCircle2 size={36} className="text-emerald-400" />
            ) : (
              <Loader2 size={36} className="text-muted-foreground/40" />
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-foreground tracking-wide">
            SINAIS FLUX <span className="text-primary">2.0</span>
          </h2>
          <p className={`text-[11px] mt-1.5 uppercase tracking-widest font-semibold transition-colors duration-300 ${
            analysisState === 'scanning' ? 'text-muted-foreground' :
            analysisState === 'pattern_found' ? 'text-primary' :
            analysisState === 'confirmed' ? 'text-emerald-400' :
            'text-muted-foreground/60'
          }`}>
            {stateLabels[analysisState]}
          </p>
        </div>

        {/* Entry info - shows when pattern found or confirmed */}
        {currentEntry && (analysisState === 'pattern_found' || analysisState === 'confirmed') && (
          <div className={`mt-4 rounded-2xl p-4 border backdrop-blur-sm animate-slide-up transition-all ${
            analysisState === 'confirmed'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-primary/30 bg-primary/5'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase tracking-widest font-bold ${
                analysisState === 'confirmed' ? 'text-emerald-400' : 'text-primary'
              }`}>
                {analysisState === 'confirmed' ? '✅ Entrada Confirmada' : '⚡ Padrão Detectado'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="text-sm font-bold text-foreground">{currentEntry}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Proteção: {maxGale} Gale{maxGale > 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Scanning indicator */}
        {analysisState === 'scanning' && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-muted-foreground/60">Monitorando rodadas em tempo real</span>
          </div>
        )}
      </div>

      {/* Recent signals */}
      {signals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1">Sinais recentes</h3>
          {signals.slice(0, 8).map(signal => {
            const time = new Date(signal.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const isGreen = signal.result === 'green';
            return (
              <div
                key={signal.id}
                className={`rounded-2xl px-4 py-3 border backdrop-blur-sm flex items-center justify-between transition-all ${
                  isGreen ? 'border-emerald-500/15 bg-emerald-500/5' : 'border-secondary/15 bg-secondary/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isGreen ? 'bg-emerald-500/15' : 'bg-secondary/15'}`}>
                    {isGreen ? <Trophy size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-secondary" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{signal.entry}</div>
                    <div className="text-[10px] text-muted-foreground">{signal.protection} • {signal.rounds > 0 ? `${signal.rounds}ª rodada` : ''}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold ${isGreen ? 'text-emerald-400' : 'text-secondary'}`}>
                    {isGreen ? 'WIN ✅' : 'LOSS ❌'}
                  </span>
                  <div className="text-[9px] text-muted-foreground/50 font-mono">{time}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
