import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft, Loader2, CheckCircle2, Shield, Zap, Crown, QrCode, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import pconLogo from '@/assets/pcon-flux-logo.png';
import iconPix from '@/assets/icon-pix.png';
import iconCard from '@/assets/icon-card.png';
import fluxFlame from '@/assets/flux-flame.png';
import LoginBackground from '@/components/LoginBackground';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

type PaymentMethod = 'pix' | 'card';

export default function Checkout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const plan = params.get('plan') as 'monthly' | 'annual' | null;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');

  // PIX state
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [pixCopied, setPixCopied] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixPaymentId, setPixPaymentId] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      navigate('/client');
      return;
    }

    const loadConfig = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['mp_public_key', 'mp_monthly_price', 'mp_annual_price']);

      if (data) {
        data.forEach(row => {
          if (row.key === 'mp_public_key') setPublicKey(row.value);
          if (row.key === 'mp_monthly_price' && plan === 'monthly') setPrice(row.value);
          if (row.key === 'mp_annual_price' && plan === 'annual') setPrice(row.value);
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);

      setLoading(false);
    };

    loadConfig();
  }, [plan, navigate]);

  // Load MP SDK for card payments
  useEffect(() => {
    if (!publicKey) return;
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, [publicKey]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const formatCardNumber = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 16);
    return nums.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 4);
    if (nums.length >= 3) return `${nums.slice(0, 2)}/${nums.slice(2)}`;
    return nums;
  };

  const formatCPF = (val: string) => {
    const nums = val.replace(/\D/g, '').slice(0, 11);
    return nums.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
      d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a
    );
  };

  // --- PIX FLOW ---
  const handleGeneratePix = async () => {
    if (!plan) return;
    if (docNumber.replace(/\D/g, '').length < 11) {
      toast.error('Informe um CPF válido');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix', {
        body: { plan, email, doc_number: docNumber.replace(/\D/g, '') },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Erro ao gerar PIX');
        setProcessing(false);
        return;
      }

      setPixQrCode(data.qr_code || '');
      setPixQrCodeBase64(data.qr_code_base64 || '');
      setPixPaymentId(data.payment_id || '');
      setPixGenerated(true);
      setAwaitingConfirmation(true);

      // Start polling for payment confirmation
      if (data.payment_id) {
        startPolling('pix');
      }

      toast.success('PIX gerado! Escaneie o QR Code ou copie o código.');
    } catch (err: any) {
      console.error('PIX error:', err);
      toast.error(err?.message || 'Erro ao gerar PIX');
    }
    setProcessing(false);
  };

  const startPolling = (source: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    pollingRef.current = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, is_active')
        .eq('user_id', user.id)
        .single();

      if (sub && sub.is_active && sub.plan !== 'trial') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setAwaitingConfirmation(false);
        setSuccess(true);
        toast.success('Pagamento confirmado!');
        setTimeout(() => navigate('/client'), 3000);
      }
    }, 4000);

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        if (!success) {
          toast.info('Tempo de espera expirou. Verifique seu painel para o status.');
          setAwaitingConfirmation(false);
        }
      }
    }, 600000);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixQrCode);
    setPixCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setPixCopied(false), 3000);
  };

  // --- CARD FLOW ---
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 13) { toast.error('Número do cartão inválido'); return; }
    if (!cardName.trim()) { toast.error('Nome no cartão obrigatório'); return; }
    if (expiry.length < 5) { toast.error('Validade inválida'); return; }
    if (cvv.length < 3) { toast.error('CVV inválido'); return; }
    if (docNumber.replace(/\D/g, '').length < 11) { toast.error('CPF inválido'); return; }

    setProcessing(true);

    try {
      const mp = new window.MercadoPago(publicKey);
      const [expiryMonth, expiryYear] = expiry.split('/');

      const tokenResponse = await mp.createCardToken({
        cardNumber: cleanCard,
        cardholderName: cardName,
        cardExpirationMonth: expiryMonth,
        cardExpirationYear: `20${expiryYear}`,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: docNumber.replace(/\D/g, ''),
      });

      if (!tokenResponse || !tokenResponse.id) {
        toast.error('Erro ao processar cartão. Verifique os dados.');
        setProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { plan, card_token: tokenResponse.id, email, doc_number: docNumber.replace(/\D/g, '') },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Erro ao processar pagamento.');
        setProcessing(false);
        return;
      }

      // Card payment sent - now wait for webhook confirmation
      setProcessing(false);
      setAwaitingConfirmation(true);
      toast.info('Pagamento enviado! Aguardando confirmação...');
      startPolling('card');
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err?.message || 'Erro ao processar pagamento.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  // Awaiting confirmation screen (for card payments without PIX QR)
  if (awaitingConfirmation && paymentMethod === 'card') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <LoginBackground />
        <div className="relative z-10 text-center space-y-6 max-w-md">
          {/* Pulsing loader */}
          <div className="relative mx-auto w-28 h-28">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center border border-primary/20"
                style={{
                  background: 'linear-gradient(135deg, hsla(187,100%,50%,0.1), hsla(187,100%,50%,0.03))',
                  boxShadow: '0 0 30px hsla(187,100%,50%,0.15)',
                }}
              >
                <Loader2 size={32} className="text-primary animate-spin" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-white">Processando Pagamento</h2>
            <p className="text-white/60 text-sm">Aguardando confirmação do Mercado Pago...</p>
          </div>

          {/* Progress steps */}
          <div className="space-y-3 text-left mx-auto max-w-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm text-white/70">Dados do cartão enviados</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm text-white/70">Pagamento processado</span>
            </div>
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-primary animate-spin" />
              <span className="text-sm text-white font-semibold">Confirmando assinatura...</span>
            </div>
          </div>

          <p className="text-xs text-white/30">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <LoginBackground />

        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${3 + (i % 4) * 2}px`,
                height: `${3 + (i % 4) * 2}px`,
                background: i % 3 === 0 ? 'hsl(187, 100%, 50%)' : i % 3 === 1 ? 'hsl(150, 100%, 50%)' : 'hsl(45, 100%, 60%)',
                left: `${5 + (i * 4.7) % 90}%`,
                bottom: '-10px',
                opacity: 0,
                animation: `particle-rise ${3 + (i % 3)}s ease-out ${i * 0.15}s forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes particle-rise {
              0% { transform: translateY(0) scale(0); opacity: 0; }
              20% { opacity: 0.8; transform: translateY(-100px) scale(1); }
              100% { transform: translateY(-${typeof window !== 'undefined' ? window.innerHeight + 100 : 1100}px) scale(0.3); opacity: 0; }
            }
            @keyframes check-draw {
              0% { stroke-dashoffset: 100; transform: scale(0.5); opacity: 0; }
              50% { transform: scale(1.15); opacity: 1; }
              100% { stroke-dashoffset: 0; transform: scale(1); opacity: 1; }
            }
            @keyframes ring-expand {
              0% { transform: scale(0.5); opacity: 0; border-width: 4px; }
              50% { opacity: 1; }
              100% { transform: scale(1); opacity: 1; border-width: 2px; }
            }
            @keyframes glow-pulse {
              0%, 100% { box-shadow: 0 0 20px hsla(150, 100%, 50%, 0.2), 0 0 60px hsla(150, 100%, 50%, 0.1); }
              50% { box-shadow: 0 0 30px hsla(150, 100%, 50%, 0.4), 0 0 80px hsla(150, 100%, 50%, 0.15); }
            }
            @keyframes text-reveal {
              0% { opacity: 0; transform: translateY(20px); filter: blur(8px); }
              100% { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes badge-pop {
              0% { transform: scale(0) rotate(-10deg); opacity: 0; }
              60% { transform: scale(1.1) rotate(2deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
          `}</style>
        </div>

        <div className="relative z-10 text-center space-y-6">
          {/* Animated check circle */}
          <div className="relative mx-auto w-28 h-28">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
              style={{ animation: 'ring-expand 0.6s ease-out forwards, glow-pulse 2s ease-in-out 0.8s infinite' }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-2 rounded-full border border-emerald-400/20"
              style={{ animation: 'ring-expand 0.6s ease-out 0.15s forwards' }}
            />
            {/* Check icon */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'check-draw 0.8s ease-out 0.3s forwards', opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-400/10 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-emerald-400 drop-shadow-[0_0_12px_hsla(150,100%,50%,0.5)]" />
              </div>
            </div>
          </div>

          {/* Text content with staggered reveal */}
          <div className="space-y-3">
            <h2
              className="text-3xl font-display font-bold text-foreground"
              style={{ animation: 'text-reveal 0.6s ease-out 0.6s forwards', opacity: 0 }}
            >
              Pagamento Confirmado!
            </h2>
            <p
              className="text-muted-foreground text-lg"
              style={{ animation: 'text-reveal 0.6s ease-out 0.8s forwards', opacity: 0 }}
            >
              Sua assinatura {plan === 'monthly' ? 'mensal' : 'anual'} foi ativada.
            </p>
          </div>

          {/* Plan badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-400/20 mx-auto"
            style={{
              background: 'linear-gradient(135deg, hsla(150, 100%, 50%, 0.08), hsla(187, 100%, 50%, 0.05))',
              animation: 'badge-pop 0.5s ease-out 1s forwards',
              opacity: 0,
            }}
          >
            <Crown size={16} className="text-emerald-400" />
            <span className="text-sm font-display font-bold text-emerald-400">
              {plan === 'monthly' ? 'Plano Mensal Ativo' : 'Plano Anual Ativo'}
            </span>
          </div>

          {/* Redirect text */}
          <p
            className="text-sm text-muted-foreground/40 flex items-center justify-center gap-2"
            style={{ animation: 'text-reveal 0.5s ease-out 1.2s forwards', opacity: 0 }}
          >
            <Loader2 size={12} className="animate-spin" />
            Redirecionando para o painel...
          </p>
        </div>
      </div>
    );
  }

  const planLabel = plan === 'monthly' ? 'P-CON FLUX Mensal' : 'P-CON FLUX Anual';
  const planDuration = plan === 'monthly' ? '30 dias' : '365 dias';
  const PlanIcon = plan === 'monthly' ? Zap : Crown;
  const planColor = plan === 'monthly' ? 'text-primary' : 'text-emerald-400';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <LoginBackground />

      <div className="w-full max-w-lg relative z-10">
        <button
          onClick={() => navigate('/client')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* Glassmorphism Card */}
        <div
          className="rounded-2xl border border-white/[0.12] overflow-hidden backdrop-blur-xl relative"
          style={{
            background: 'linear-gradient(160deg, hsla(187, 80%, 20%, 0.25) 0%, hsla(240, 10%, 12%, 0.7) 40%, hsla(345, 60%, 15%, 0.15) 100%)',
            boxShadow: '0 25px 60px hsla(0,0%,0%,0.5), inset 0 1px 0 hsla(187,100%,70%,0.1), 0 0 100px hsla(187, 100%, 50%, 0.05)',
          }}
        >
          {/* Top gradient line */}
          <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, hsl(345, 100%, 50%), hsl(187, 100%, 50%), hsl(260, 100%, 60%))' }} />

          {/* Subtle inner gradient overlay */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'radial-gradient(ellipse at top center, hsla(187,100%,50%,0.04) 0%, transparent 60%)' }} />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-white/[0.08] relative">
            <img src={pconLogo} alt="P-CON FLUX" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-[0_0_16px_hsla(187,100%,50%,0.4)]" />
            <h1 className="text-xl font-display font-bold text-white">Checkout Seguro</h1>
            <p className="text-sm text-white/60 mt-1">Finalize sua assinatura</p>
          </div>

          {/* Plan Summary */}
          <div className="px-6 py-4 border-b border-white/[0.08] relative" style={{ background: 'linear-gradient(90deg, hsla(187, 100%, 50%, 0.04), transparent)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan === 'monthly' ? 'bg-primary/15 border border-primary/30' : 'bg-emerald-400/15 border border-emerald-400/30'}`}>
                  <PlanIcon size={18} className={planColor} />
                </div>
                <div>
                  <p className="text-sm font-display font-bold text-white">{planLabel}</p>
                  <p className="text-xs text-white/40">{planDuration}</p>
                </div>
              </div>
              <p className={`text-xl font-display font-bold ${planColor} drop-shadow-[0_0_8px_hsla(187,100%,50%,0.3)]`}>
                R$ {price}
              </p>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="px-6 pt-5">
            <div className="flex gap-2 p-1.5 rounded-xl border border-white/[0.08] backdrop-blur-sm" style={{ background: 'hsla(240, 5%, 10%, 0.4)' }}>
              <button
                onClick={() => { setPaymentMethod('pix'); setPixGenerated(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                  paymentMethod === 'pix'
                    ? 'text-white border border-primary/30'
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={paymentMethod === 'pix' ? { background: 'linear-gradient(135deg, hsla(187,100%,50%,0.2), hsla(187,100%,50%,0.08))', boxShadow: '0 0 15px hsla(187,100%,50%,0.1)' } : {}}
              >
                <img src={iconPix} alt="PIX" className="w-5 h-5" />
                PIX
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                  paymentMethod === 'card'
                    ? 'text-white border border-primary/30'
                    : 'text-white/40 hover:text-white/60'
                }`}
                style={paymentMethod === 'card' ? { background: 'linear-gradient(135deg, hsla(187,100%,50%,0.2), hsla(187,100%,50%,0.08))', boxShadow: '0 0 15px hsla(187,100%,50%,0.1)' } : {}}
              >
                <img src={iconCard} alt="Cartão" className="w-5 h-5" />
                Cartão
              </button>
            </div>
          </div>

          {/* PIX Form */}
          {paymentMethod === 'pix' && (
            <div className="px-6 py-5 space-y-4">
              {!pixGenerated ? (
                <>
                  {/* CPF */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-display font-semibold text-white/70">CPF do Titular</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={docNumber}
                      onChange={(e) => setDocNumber(formatCPF(e.target.value))}
                      className="w-full h-11 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-mono text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <Shield size={14} className="text-emerald-400/80" />
                    <p className="text-[11px] text-white/50">Pagamento instantâneo via PIX • Mercado Pago</p>
                  </div>

                  <button
                    onClick={handleGeneratePix}
                    disabled={processing}
                    className="w-full h-12 rounded-xl font-display font-bold tracking-wide text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white"
                    style={{
                      background: 'linear-gradient(135deg, hsl(187, 100%, 45%), hsl(187, 100%, 35%))',
                      boxShadow: '0 4px 25px hsla(187, 100%, 50%, 0.35), inset 0 1px 0 hsla(0,0%,100%,0.15)',
                    }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Gerando PIX...
                      </>
                    ) : (
                      <>
                        <img src={iconPix} alt="PIX" className="w-5 h-5" />
                        Gerar PIX • R$ {price}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {/* QR Code */}
                  {pixQrCodeBase64 && (
                    <div className="flex justify-center">
                      <div className="p-3 bg-white rounded-2xl">
                        <img
                          src={`data:image/png;base64,${pixQrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground/50">
                    Escaneie o QR Code ou copie o código abaixo
                  </p>

                  {/* PIX Copy-Paste */}
                  {pixQrCode && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={pixQrCode}
                          className="w-full h-11 px-4 pr-12 rounded-xl border border-border/20 bg-background/40 text-[10px] font-mono text-foreground/60 focus:outline-none truncate"
                        />
                        <button
                          onClick={copyPixCode}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          {pixCopied ? (
                            <Check size={16} className="text-emerald-400" />
                          ) : (
                            <Copy size={16} className="text-muted-foreground/40" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 justify-center py-3 px-4 rounded-xl border border-primary/15" style={{ background: 'linear-gradient(135deg, hsla(187,100%,50%,0.06), transparent)' }}>
                    <Loader2 size={16} className="text-primary animate-spin" />
                    <p className="text-xs text-white/70 font-display font-semibold">Aguardando confirmação do pagamento...</p>
                  </div>

                  <button
                    onClick={() => { setPixGenerated(false); setPixQrCode(''); setPixQrCodeBase64(''); }}
                    className="w-full h-10 rounded-xl border border-border/20 text-muted-foreground/50 text-xs font-display font-semibold hover:text-foreground/70 transition-colors"
                  >
                    Gerar novo PIX
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card Form */}
          {paymentMethod === 'card' && (
            <form onSubmit={handleCardSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-display font-semibold text-white/70">Número do Cartão</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-mono text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-display font-semibold text-white/70">Nome no Cartão</label>
                <input
                  type="text"
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full h-11 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-mono text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-display font-semibold text-white/70">Validade</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-mono text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-display font-semibold text-white/70">CVV</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full h-11 px-4 pr-10 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-mono text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none transition-colors"
                    />
                    <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-display font-semibold text-white/70">CPF do Titular</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={docNumber}
                  onChange={(e) => setDocNumber(formatCPF(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-white/[0.1] bg-white/[0.04] text-sm font-mono text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <Shield size={14} className="text-emerald-400/80" />
                <p className="text-[11px] text-white/50">Pagamento seguro processado pelo Mercado Pago</p>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full h-12 rounded-xl font-display font-bold tracking-wide text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-white"
                style={{
                  background: 'linear-gradient(135deg, hsl(187, 100%, 45%), hsl(187, 100%, 35%))',
                  boxShadow: '0 4px 25px hsla(187, 100%, 50%, 0.35), inset 0 1px 0 hsla(0,0%,100%,0.15)',
                }}
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Pagar R$ {price}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
