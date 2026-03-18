import { useState, useEffect } from 'react';
import { Crown, Zap, X, Sparkles, Loader2 } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import pconLogo from '@/assets/pcon-flux-logo.png';

export default function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal, subscription } = useSubscription();
  const [monthlyPrice, setMonthlyPrice] = useState('--');
  const [annualPrice, setAnnualPrice] = useState('--');
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'annual' | null>(null);

  useEffect(() => {
    if (!showUpgradeModal) return;
    const loadPrices = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['mp_monthly_price', 'mp_annual_price']);
      if (data) {
        data.forEach(row => {
          if (row.key === 'mp_monthly_price') setMonthlyPrice(row.value);
          if (row.key === 'mp_annual_price') setAnnualPrice(row.value);
        });
      }
    };
    loadPrices();
  }, [showUpgradeModal]);

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoadingPlan(plan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Você precisa estar logado para assinar.');
        setLoadingPlan(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { plan },
      });

      if (error) {
        console.error('Subscription error:', error);
        toast.error('Erro ao criar assinatura. Tente novamente.');
        setLoadingPlan(null);
        return;
      }

      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank');
        toast.success('Redirecionando para o checkout do Mercado Pago...');
      } else {
        toast.error(data?.error || 'Erro ao gerar link de pagamento.');
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro inesperado. Tente novamente.');
    }
    setLoadingPlan(null);
  };

  if (!showUpgradeModal) return null;

  const canDismiss = true;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl border border-border/20 animate-scale-in relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsla(240,6%,13%,0.99) 0%, hsla(240,6%,7%,1) 100%)',
          boxShadow: '0 0 80px hsla(187,100%,50%,0.06), 0 25px 60px hsla(0,0%,0%,0.6)',
        }}
      >
        {/* Top glow line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Subtle radial glow behind icon */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-40 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, hsla(187,100%,50%,0.06) 0%, transparent 70%)' }}
        />

        {canDismiss && (
          <button
            onClick={() => setShowUpgradeModal(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted/10 border border-border/20 flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/20 transition-all z-10"
          >
            <X size={16} />
          </button>
        )}

        <div className="relative z-10 px-7 pt-8 pb-7">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img src={pconLogo} alt="P-CON FLUX" className="w-32 h-32 object-contain drop-shadow-lg" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground text-center mb-1.5">
            {subscription?.isExpired ? 'Seu período de teste expirou' : 'Faça upgrade do seu plano'}
          </h2>
          <p className="text-sm text-muted-foreground/50 text-center mb-7">
            {subscription?.isExpired
              ? 'Para continuar acessando, escolha um plano abaixo.'
              : 'Desbloqueie todos os recursos da plataforma.'}
          </p>

          {/* Plans */}
          <div className="space-y-3">
            {/* Monthly */}
            <button
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-primary/15 transition-all hover:border-primary/35 group text-left"
              style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.04) 0%, hsla(187,100%,50%,0.01) 100%)' }}
            >
              <div
                className="w-11 h-11 shrink-0 rounded-xl border border-primary/25 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.15) 0%, hsla(187,100%,50%,0.05) 100%)' }}
              >
                <Zap size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground tracking-wide">P-CON FLUX MENSAL</p>
                <p className="text-xs text-muted-foreground/40 mt-0.5">Acesso completo por 30 dias</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">R$ {monthlyPrice}</p>
                <span className="text-[10px] font-bold text-primary/60 tracking-widest group-hover:translate-x-0.5 transition-transform inline-block">
                  ASSINAR →
                </span>
              </div>
            </button>

            {/* Annual */}
            <button
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-emerald-400/20 transition-all hover:border-emerald-400/40 group text-left relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, hsla(155,80%,50%,0.05) 0%, hsla(155,80%,50%,0.01) 100%)' }}
            >
              {/* Best option badge */}
              <div className="absolute top-2.5 right-3 flex items-center gap-1 bg-emerald-400/15 border border-emerald-400/20 px-2 py-[2px] rounded-lg">
                <Sparkles size={9} className="text-emerald-400" />
                <span className="text-[8px] font-bold tracking-widest text-emerald-400">MELHOR OPÇÃO</span>
              </div>

              <div
                className="w-11 h-11 shrink-0 rounded-xl border border-emerald-400/25 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, hsla(155,80%,50%,0.15) 0%, hsla(155,80%,50%,0.05) 100%)' }}
              >
                <Crown size={20} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground tracking-wide">P-CON FLUX ANUAL</p>
                <p className="text-xs text-muted-foreground/40 mt-0.5">Acesso completo por 365 dias</p>
              </div>
              <div className="text-right shrink-0 mt-2">
                <p className="text-lg font-bold text-emerald-400">R$ {annualPrice}</p>
                <span className="text-[10px] font-bold text-emerald-400/60 tracking-widest group-hover:translate-x-0.5 transition-transform inline-block">
                  ASSINAR →
                </span>
              </div>
            </button>
          </div>

          {/* Footer */}
          {!subscription?.isExpired && subscription?.timeRemaining && (
            <p className="text-xs text-center text-muted-foreground/30 mt-5">
              Você ainda tem <span className="text-muted-foreground/50 font-semibold">{subscription.timeRemaining}</span> de teste grátis
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
