import { useState, useEffect, useCallback } from 'react';
import { Zap, Trophy, XCircle, Percent, ChevronDown, Loader2, CheckCircle2, Radio, Lock, Shield } from 'lucide-react';
import { type Signal, type BlazeColor } from '@/data/mockData';
import { useBlazeDouble } from '@/hooks/useBlazeDouble';
import flameIcon from '@/assets/flame-icon.png';
import BlazeRouletteStrip from '@/components/BlazeRouletteStrip';
import { useSubscription } from '@/contexts/SubscriptionContext';
import LockedFeature from '@/components/LockedFeature';
import { supabase } from '@/integrations/supabase/client';

type AnalysisState = 'scanning' | 'pattern_found' | 'confirmed' | 'idle';

const stateLabels: Record<AnalysisState, string> = {
  scanning: 'Analisando padrões...',
  pattern_found: 'Padrão detectado!',
  confirmed: '🔥 Entrada confirmada!',
  idle: 'Aguardando análise...'
};

const ClientDashboard = () => {
  const { hasActiveSubscription, setShowUpgradeModal } = useSubscription();
  const [maxGale, setMaxGale] = useState(1);
  const [minAssert, setMinAssert] = useState(95);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('scanning');
  const [currentEntry, setCurrentEntry] = useState<string | null>(null);
  const [showGaleDropdown, setShowGaleDropdown] = useState(false);
  const [showAssertDropdown, setShowAssertDropdown] = useState(false);

  // Integração API em tempo real para os "Giros anteriores"
  const { results: apiResults } = useBlazeDouble();

  // Load today's signals from DB
  useEffect(() => {
    const loadSignals = async () => {
      const { data, error } = await supabase
        .from('signals')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

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
        setSignals(mapped);

        // Se o sinal mais recente ainda estiver como pending, ativa a telinha de "Entrada confirmada"
        if (mapped.length > 0 && mapped[0].result === 'pending') {
          setAnalysisState('confirmed');
          setCurrentEntry(mapped[0].entry);
          setMaxGale(mapped[0].protection.includes('Sem') ? 0 : parseInt(mapped[0].protection.match(/\d+/)?.[0] || '1'));
        }
      }
    };
    loadSignals();

    const channel = supabase.channel('realtime_signals')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload) => {
        const s = payload.new;
        const newSig: Signal = {
          id: s.id, type: s.signal_type, entry: s.entry, protection: s.protection,
          result: s.result, timestamp: s.created_at, rounds: s.rounds, target: s.target
        };
        
        setSignals(prev => [newSig, ...prev]);
        
        if (s.result === 'pending') {
          setAnalysisState('confirmed');
          setCurrentEntry(s.entry);
          setMaxGale(s.protection.includes('Sem') ? 0 : parseInt(s.protection.match(/\d+/)?.[0] || '1'));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'signals' }, (payload) => {
        const s = payload.new;
        setSignals(prev => prev.map(sig => sig.id === s.id ? { ...sig, result: s.result, rounds: s.rounds } : sig));
        
        // Se o sinal atualizado (foi resolvido green/loss) e era nosso "currentEntry" pendente
        if (s.result !== 'pending') {
            setAnalysisState('idle');
            setCurrentEntry(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const saveSignalToDB = useCallback(async (signal: Signal) => {
    await supabase.from('signals').insert({
      signal_type: signal.type,
      entry: signal.entry,
      protection: signal.protection,
      result: signal.result,
      rounds: signal.rounds,
      target: signal.target,
    });
  }, []);

  const greens = signals.filter((s) => s.result === 'green').length;
  const losses = signals.filter((s) => s.result === 'loss').length;
  const assertRate = greens + losses > 0 ? Math.round(greens / (greens + losses) * 100) : 100;

  useEffect(() => {
    // Mantém o escanner girando se a api cair
    if (apiResults.length === 0) {
       setAnalysisState('scanning');
    } else {
       // Só derruba pra 'idle' se não houver tela confirmada pendente 
       setAnalysisState(prev => prev === 'confirmed' ? 'confirmed' : 'idle');
    }
  }, [apiResults]);

  const isLocked = !hasActiveSubscription;

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



      {/* Analysis area */}
      <div className="rounded-3xl p-6 border border-border/50 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, hsla(240,6%,12%,0.9) 0%, hsla(240,6%,8%,0.95) 100%)' }}>
        <div className={`absolute top-0 left-1/4 right-1/4 h-1 rounded-b-full transition-all duration-700 ${
        analysisState === 'confirmed' ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent' :
        analysisState === 'pattern_found' ? 'bg-gradient-to-r from-transparent via-primary to-transparent' :
        'bg-gradient-to-r from-transparent via-secondary/60 to-transparent'}`
        } />
        <div className="mb-4">
          <BlazeRouletteStrip spinning={analysisState === 'scanning'} />
        </div>

        {/* Giros Anteriores */}
        <div className="mb-4">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Giros anteriores</h3>
          <div className="flex gap-1.5 overflow-hidden">
            {apiResults.slice(0, 15).map((r) => {
              const bg = r.color === 'red' ? 'bg-secondary' : r.color === 'white' ? 'bg-[hsl(0_0%_88%)]' : 'bg-[hsl(240_6%_15%)]';
              const border = r.color === 'red' ? 'border-secondary/40' : r.color === 'white' ? 'border-[hsl(0_0%_75%)]/40' : 'border-[hsl(240_6%_25%)]/40';
              const text = r.color === 'red' ? 'text-white' : r.color === 'white' ? 'text-[hsl(240_6%_10%)]' : 'text-muted-foreground';
              const isWhite = r.color === 'white';
              return (
                <div
                  key={r.id}
                  className={`w-7 h-7 shrink-0 rounded-full ${bg} border ${border} flex items-center justify-center ${isWhite ? 'ring-1 ring-[hsl(0_0%_70%)]/30' : ''}`}
                >
                  <span className={`text-[9px] font-bold ${text}`}>{r.roll}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="text-center mb-2">
          

          
          <p className={`text-[11px] mt-1.5 uppercase tracking-widest font-semibold transition-colors duration-300 ${
          analysisState === 'scanning' ? 'text-muted-foreground' :
          analysisState === 'pattern_found' ? 'text-primary' :
          analysisState === 'confirmed' ? 'text-emerald-400' :
          'text-muted-foreground/60'}`
          }>
            {stateLabels[analysisState]}
          </p>
        </div>
        {currentEntry && (analysisState === 'pattern_found' || analysisState === 'confirmed') &&
        <div className={`mt-4 rounded-2xl p-4 border backdrop-blur-sm animate-slide-up transition-all ${
        analysisState === 'confirmed' ?
        'border-emerald-500/30 bg-emerald-500/5' :
        'border-primary/30 bg-primary/5'}`
        }>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase tracking-widest font-bold ${
            analysisState === 'confirmed' ? 'text-emerald-400' : 'text-primary'}`
            }>
                {analysisState === 'confirmed' ? '✅ Entrada Confirmada' : '⚡ Padrão Detectado'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="text-sm font-bold text-foreground">{currentEntry}</div>
            <div className="text-[10px] text-muted-foreground mt-1">Proteção: {maxGale} Gale{maxGale > 1 ? 's' : ''}</div>
          </div>
        }
        {analysisState === 'scanning' &&
        <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] text-muted-foreground/60">Monitorando rodadas em tempo real</span>
          </div>
        }

        {/* Locked overlay — centered on roulette area */}
        {isLocked && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl">
            <div className="absolute inset-0 backdrop-blur-[6px] bg-background/60 rounded-3xl" />
            <div className="relative z-10 w-[85%] max-w-[260px] rounded-2xl border border-primary/25 animate-scale-in"
              style={{ background: 'linear-gradient(180deg, hsla(240,6%,14%,0.98) 0%, hsla(240,6%,8%,0.99) 100%)', boxShadow: '0 0 30px hsla(187,100%,50%,0.08), 0 12px 40px hsla(0,0%,0%,0.5)' }}>
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-2xl" />
              <div className="px-5 py-4 text-center">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mx-auto mb-3 relative">
                  <Lock size={20} className="text-primary" />
                  <div className="absolute inset-0 rounded-xl animate-pulse" style={{ boxShadow: '0 0 15px hsla(187,100%,50%,0.15)' }} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Assine um Plano</h3>
                <p className="text-[11px] text-muted-foreground/50 mb-4 leading-relaxed">
                  Desbloqueie sinais em tempo real e funcionalidades premium.
                </p>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full py-2.5 rounded-xl text-[13px] font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-background"
                  style={{ background: 'linear-gradient(135deg, hsl(187,100%,45%) 0%, hsl(187,100%,35%) 100%)', boxShadow: '0 4px 16px hsla(187,100%,50%,0.3)' }}
                >
                  <Shield size={14} />
                  Ver Planos
                </button>
              </div>
            </div>
          </div>
        )}
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

      {/* Recent signals */}
      {signals.length > 0 &&
      <div className="space-y-2">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold px-1">Sinais recentes</h3>
          {signals.slice(0, 8).map((signal) => {
          const time = new Date(signal.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const isGreen = signal.result === 'green';
          const galeText = signal.protection === 'Sem proteção' ? 'Sem proteção' : signal.protection;
          const roundText = signal.rounds > 0 ? `${signal.rounds}ª rodada` : 'Direto';
          return (
            <div
              key={signal.id}
              className={`rounded-2xl px-4 py-3.5 border backdrop-blur-sm transition-all ${
              isGreen ? 'border-emerald-500/15 bg-emerald-500/[0.04]' : 
              signal.result === 'pending' ? 'border-primary/15 bg-primary/[0.04]' : 
              'border-secondary/15 bg-secondary/[0.04]'}`
              }>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isGreen ? 'bg-emerald-500/15 border border-emerald-500/20' : 
                        signal.result === 'pending' ? 'bg-primary/15 border border-primary/20' : 
                        'bg-secondary/15 border border-secondary/20'}`}>
                      {isGreen ? <CheckCircle2 size={16} className="text-emerald-400" /> : 
                       signal.result === 'pending' ? <Loader2 size={16} className="text-primary animate-spin" /> : 
                       <XCircle size={16} className="text-secondary" />}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-foreground">{signal.entry}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/50">{galeText}</span>
                        <span className="text-muted-foreground/20">•</span>
                        <span className="text-[10px] text-muted-foreground/50">{roundText}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-0.5">
                    <span className={`text-[11px] font-bold tracking-wide ${
                        isGreen ? 'text-emerald-400' : 
                        signal.result === 'pending' ? 'text-primary' : 
                        'text-secondary'}`}>
                      {isGreen ? 'WIN ✅' : signal.result === 'pending' ? 'PENDENTE ⏳' : 'LOSS ✕'}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 font-mono">{time}</span>
                  </div>
                </div>
              </div>);

        })}
        </div>
      }

    </div>);

};

export default ClientDashboard;