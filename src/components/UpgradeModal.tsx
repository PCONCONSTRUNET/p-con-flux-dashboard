import { Crown, Zap, Shield, X } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal, subscription } = useSubscription();

  if (!showUpgradeModal) return null;

  // If plan is expired, don't allow dismissal
  const canDismiss = subscription && !subscription.isExpired;

  return (
    <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card/95 backdrop-blur-xl rounded-3xl p-8 border border-border/30 animate-fade-in shadow-2xl relative">
        {canDismiss && (
          <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-muted-foreground/40 hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/10">
            <Shield size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {subscription?.isExpired ? 'Seu período de teste expirou' : 'Faça upgrade do seu plano'}
          </h2>
          <p className="text-sm text-muted-foreground/60 mt-2">
            {subscription?.isExpired
              ? 'Para continuar acessando a plataforma, escolha um plano.'
              : 'Desbloqueie todos os recursos da plataforma.'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Monthly */}
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Zap size={22} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">P-CON FLUX MENSAL</p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">Acesso completo por 30 dias</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-primary tracking-wider">ASSINAR</span>
            </div>
          </div>

          {/* Annual */}
          <div className="flex items-center gap-4 p-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 hover:bg-emerald-400/10 transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[9px] font-bold tracking-widest bg-emerald-400/20 text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-400/20">
              MELHOR OPÇÃO
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
              <Crown size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground">P-CON FLUX ANUAL</p>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5">Acesso completo por 365 dias</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 tracking-wider">ASSINAR</span>
            </div>
          </div>
        </div>

        {!subscription?.isExpired && (
          <p className="text-[10px] text-center text-muted-foreground/30 mt-6">
            Você ainda tem {subscription?.timeRemaining} de teste grátis
          </p>
        )}
      </div>
    </div>
  );
}
