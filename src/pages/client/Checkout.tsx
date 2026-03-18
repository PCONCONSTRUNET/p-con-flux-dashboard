import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ArrowLeft, Loader2, CheckCircle2, Shield, Zap, Crown, QrCode, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import pconLogo from '@/assets/pcon-flux-logo.png';
import iconPix from '@/assets/icon-pix.png';
import iconCard from '@/assets/icon-card.png';

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

      // Start polling for payment confirmation
      if (data.payment_id) {
        startPolling(data.payment_id);
      }

      toast.success('PIX gerado! Escaneie o QR Code ou copie o código.');
    } catch (err: any) {
      console.error('PIX error:', err);
      toast.error(err?.message || 'Erro ao gerar PIX');
    }
    setProcessing(false);
  };

  const startPolling = (paymentId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    // Poll subscription status every 5 seconds
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
        setSuccess(true);
        toast.success('Pagamento PIX confirmado!');
        setTimeout(() => navigate('/client'), 3000);
      }
    }, 5000);

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (pollingRef.current) clearInterval(pollingRef.current);
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

      setSuccess(true);
      toast.success('Assinatura realizada com sucesso!');
      setTimeout(() => navigate('/client'), 3000);
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err?.message || 'Erro ao processar pagamento.');
    }
    setProcessing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background celebration glows */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[180px] animate-pulse" style={{ background: 'hsl(187, 100%, 50%)' }} />
          <div className="absolute bottom-[20%] left-[30%] w-[400px] h-[400px] rounded-full opacity-[0.05] blur-[150px] animate-pulse" style={{ background: 'hsl(150, 100%, 50%)', animationDelay: '0.5s' }} />
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full opacity-[0.04] blur-[120px] animate-pulse" style={{ background: 'hsl(260, 100%, 60%)', animationDelay: '1s' }} />
        </div>

        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
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
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full opacity-[0.06] blur-[180px]" style={{ background: 'hsl(187, 100%, 50%)' }} />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full opacity-[0.04] blur-[150px]" style={{ background: 'hsl(345, 100%, 50%)' }} />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-[0.03] blur-[120px]" style={{ background: 'hsl(260, 100%, 60%)' }} />
      </div>

      {/* Floating FLUX icons */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <img
            key={i}
            src={pconLogo}
            alt=""
            className="absolute opacity-[0.04] select-none"
            style={{
              width: `${28 + (i % 4) * 12}px`,
              height: `${28 + (i % 4) * 12}px`,
              top: `${8 + (i * 7.5) % 85}%`,
              left: `${5 + (i * 13.7) % 88}%`,
              transform: `rotate(${i * 30}deg)`,
              animation: `float-icon ${6 + (i % 3) * 2}s ease-in-out ${i * 0.5}s infinite alternate`,
              filter: 'drop-shadow(0 0 6px hsla(187, 100%, 50%, 0.3))',
            }}
          />
        ))}
        <style>{`
          @keyframes float-icon {
            0% { transform: translateY(0px) rotate(0deg); opacity: 0.03; }
            50% { opacity: 0.06; }
            100% { transform: translateY(-20px) rotate(15deg); opacity: 0.03; }
          }
        `}</style>
      </div>

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
          className="rounded-2xl border border-white/[0.08] overflow-hidden backdrop-blur-xl"
          style={{
            background: 'linear-gradient(160deg, hsla(240, 5%, 15%, 0.6) 0%, hsla(240, 5%, 8%, 0.7) 100%)',
            boxShadow: '0 25px 60px hsla(0,0%,0%,0.5), inset 0 1px 0 hsla(0,0%,100%,0.05), 0 0 80px hsla(187, 100%, 50%, 0.03)',
          }}
        >
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-white/[0.05]">
            <img src={pconLogo} alt="P-CON FLUX" className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-[0_0_12px_hsla(187,100%,50%,0.3)]" />
            <h1 className="text-lg font-display font-bold text-foreground">Checkout Seguro</h1>
            <p className="text-sm text-muted-foreground/50 mt-1">Finalize sua assinatura</p>
          </div>

          {/* Plan Summary */}
          <div className="px-6 py-4 border-b border-white/[0.05]" style={{ background: 'hsla(187, 100%, 50%, 0.02)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan === 'monthly' ? 'bg-primary/10 border border-primary/20' : 'bg-emerald-400/10 border border-emerald-400/20'}`}>
                  <PlanIcon size={18} className={planColor} />
                </div>
                <div>
                  <p className="text-sm font-display font-bold text-foreground">{planLabel}</p>
                  <p className="text-xs text-muted-foreground/40">{planDuration}</p>
                </div>
              </div>
              <p className={`text-xl font-display font-bold ${planColor}`}>
                R$ {price}
              </p>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="px-6 pt-5">
            <div className="flex gap-2 p-1.5 rounded-xl border border-white/[0.06] backdrop-blur-sm" style={{ background: 'hsla(240, 5%, 10%, 0.5)' }}>
              <button
                onClick={() => { setPaymentMethod('pix'); setPixGenerated(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-semibold transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'text-muted-foreground/50 hover:text-muted-foreground/70'
                }`}
              >
                <img src={iconPix} alt="PIX" className="w-5 h-5" />
                PIX
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-primary/15 text-primary border border-primary/25'
                    : 'text-muted-foreground/50 hover:text-muted-foreground/70'
                }`}
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
                    <label className="text-xs font-display font-semibold text-muted-foreground/60">CPF do Titular</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={docNumber}
                      onChange={(e) => setDocNumber(formatCPF(e.target.value))}
                      className="w-full h-11 px-4 rounded-xl border border-border/20 bg-background/40 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:border-primary/40 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2 py-2">
                    <Shield size={14} className="text-emerald-400/60" />
                    <p className="text-[11px] text-muted-foreground/40">Pagamento instantâneo via PIX • Mercado Pago</p>
                  </div>

                  <button
                    onClick={handleGeneratePix}
                    disabled={processing}
                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-bold tracking-wide text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ boxShadow: '0 4px 20px hsla(187, 100%, 50%, 0.25)' }}
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

                  <div className="flex items-center gap-2 justify-center py-2">
                    <Loader2 size={14} className="text-primary animate-spin" />
                    <p className="text-xs text-muted-foreground/50">Aguardando confirmação do pagamento...</p>
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
                <label className="text-xs font-display font-semibold text-muted-foreground/60">Número do Cartão</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/20 bg-background/40 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:border-primary/40 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-display font-semibold text-muted-foreground/60">Nome no Cartão</label>
                <input
                  type="text"
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full h-11 px-4 rounded-xl border border-border/20 bg-background/40 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-display font-semibold text-muted-foreground/60">Validade</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border border-border/20 bg-background/40 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:border-primary/40 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-display font-semibold text-muted-foreground/60">CVV</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full h-11 px-4 pr-10 rounded-xl border border-border/20 bg-background/40 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:border-primary/40 focus:outline-none transition-colors"
                    />
                    <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/20" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-display font-semibold text-muted-foreground/60">CPF do Titular</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={docNumber}
                  onChange={(e) => setDocNumber(formatCPF(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-border/20 bg-background/40 text-sm font-mono text-foreground placeholder:text-muted-foreground/20 focus:border-primary/40 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <Shield size={14} className="text-emerald-400/60" />
                <p className="text-[11px] text-muted-foreground/40">Pagamento seguro processado pelo Mercado Pago</p>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-bold tracking-wide text-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ boxShadow: '0 4px 20px hsla(187, 100%, 50%, 0.25)' }}
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
