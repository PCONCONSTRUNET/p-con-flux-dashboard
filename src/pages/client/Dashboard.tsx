import { useState, useEffect, useCallback } from 'react';
import { Zap, Trophy, XCircle, Percent, ChevronDown, ExternalLink, Loader2 } from 'lucide-react';
import { mockSignals, type Signal, type SignalResult } from '@/data/mockData';
import flameIcon from '@/assets/flame-icon.png';

const ClientDashboard = () => {
  const [maxGale, setMaxGale] = useState(1);
  const [minAssert, setMinAssert] = useState(95);
  const [signals, setSignals] = useState<Signal[]>(mockSignals);
  const [analyzing, setAnalyzing] = useState(false);
  const [showGaleDropdown, setShowGaleDropdown] = useState(false);
  const [showAssertDropdown, setShowAssertDropdown] = useState(false);

  const greens = signals.filter(s => s.result === 'green').length;
  const losses = signals.filter(s => s.result === 'loss').length;
  const assertRate = greens + losses > 0 ? Math.round((greens / (greens + losses)) * 100) : 100;
  const pending = signals.filter(s => s.result === 'pending');
  const lastSignal = signals[0];

  // Simulate auto signals
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => prev.map(s =>
        s.result === 'pending'
          ? { ...s, result: Math.random() > 0.25 ? 'green' as const : 'loss' as const }
          : s
      ));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = useCallback(() => {
    setAnalyzing(true);
    setTimeout(() => {
      const newSignal: Signal = {
        id: `s-${Date.now()}`,
        type: 'Auto',
        entry: `${Math.random() > 0.5 ? 'Vermelho' : 'Preto'} → ${Math.random() > 0.5 ? 'Preto' : 'Vermelho'}`,
        protection: `${maxGale} Gale${maxGale > 1 ? 's' : ''}`,
        result: 'pending',
        timestamp: new Date().toISOString(),
        rounds: 0,
        target: 'Double',
      };
      setSignals(prev => [newSignal, ...prev]);
      setAnalyzing(false);
    }, 2500);
  }, [maxGale]);

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={flameIcon} alt="" className="w-7 h-7" />
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              SINAIS <span className="text-primary">FLUX</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Online</span>
        </div>
      </div>

      {/* Controls row */}
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

      {/* Open platform link */}
      <button className="w-full rounded-2xl p-3.5 border border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between active:scale-[0.98] transition-all hover:border-primary/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
            <img src={flameIcon} alt="" className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Plataforma Oficial</div>
            <div className="text-sm font-bold text-foreground">Abrir Jogo Double</div>
          </div>
        </div>
        <ExternalLink size={16} className="text-muted-foreground" />
      </button>

      {/* Stats row */}
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

      {/* Signal area */}
      <div className="rounded-3xl p-6 border border-border/50 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.9) 0%, hsla(240,6%,8%,0.95) 100%)' }}>
        {/* Top accent line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-1 rounded-b-full bg-gradient-to-r from-transparent via-secondary to-transparent" />

        {/* Signal circle */}
        <div className="flex justify-center mb-5">
          <div className={`w-28 h-28 rounded-full border-[3px] flex items-center justify-center transition-all ${
            analyzing
              ? 'border-primary/50 animate-pulse'
              : pending.length > 0
                ? 'border-primary/40 shadow-[0_0_30px_hsla(187,100%,50%,0.15)]'
                : lastSignal?.result === 'green'
                  ? 'border-emerald-500/40 shadow-[0_0_30px_hsla(145,80%,50%,0.15)]'
                  : lastSignal?.result === 'loss'
                    ? 'border-secondary/40 shadow-[0_0_30px_hsla(345,100%,50%,0.15)]'
                    : 'border-border/30'
          }`}>
            {analyzing ? (
              <Loader2 size={36} className="text-primary animate-spin" />
            ) : (
              <Zap size={36} className={
                pending.length > 0 ? 'text-primary' :
                lastSignal?.result === 'green' ? 'text-emerald-400' :
                lastSignal?.result === 'loss' ? 'text-secondary' : 'text-muted-foreground'
              } />
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-5">
          <h2 className="text-lg font-bold text-foreground tracking-wide">
            SINAIS FLUX <span className="text-primary">2.0</span>
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest">
            {analyzing ? 'Analisando padrões...' :
             pending.length > 0 ? 'Sinal ativo — aguardando resultado' :
             'Toque para analisar'}
          </p>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wider active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white"
          style={{
            background: analyzing
              ? 'linear-gradient(135deg, hsla(240,6%,20%,1), hsla(240,6%,15%,1))'
              : 'linear-gradient(135deg, hsl(345, 100%, 50%), hsl(345, 80%, 40%))',
            boxShadow: analyzing ? 'none' : '0 8px 32px hsla(345, 100%, 50%, 0.3)',
          }}
        >
          {analyzing ? (
            <><Loader2 size={16} className="animate-spin" /> ANALISANDO...</>
          ) : (
            <><Zap size={16} /> GERAR SINAL AGORA</>
          )}
        </button>
      </div>

      {/* Recent signals */}
      {signals.filter(s => s.result !== 'pending').length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1">Sinais recentes</h3>
          {signals.filter(s => s.result !== 'pending').slice(0, 6).map(signal => {
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
