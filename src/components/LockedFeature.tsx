import { Lock, Shield } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface LockedFeatureProps {
  feature: string;
}

export default function LockedFeature({ feature }: LockedFeatureProps) {
  const { setShowUpgradeModal } = useSubscription();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-muted/20 border border-border/30 flex items-center justify-center mb-6 shadow-lg shadow-muted/5">
        <Lock size={36} className="text-muted-foreground/50" />
      </div>
      <h2 className="text-xl font-bold text-foreground text-center">
        Acesso Bloqueado
      </h2>
      <p className="text-sm text-muted-foreground/60 text-center mt-2 max-w-xs">
        Seu período de teste expirou. Assine um plano para acessar <span className="text-foreground font-semibold">{feature}</span>.
      </p>
      <button
        onClick={() => setShowUpgradeModal(true)}
        className="mt-6 px-6 py-3 rounded-2xl bg-primary/15 text-primary border border-primary/30 text-sm font-bold tracking-wide hover:bg-primary/25 transition-all flex items-center gap-2"
      >
        <Shield size={16} />
        Ver Planos
      </button>
    </div>
  );
}
