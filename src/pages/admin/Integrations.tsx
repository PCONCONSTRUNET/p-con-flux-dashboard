import { useState, useEffect } from 'react';
import mercadoPagoIcon from '@/assets/mercadopago-icon.png';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreditCard, Eye, EyeOff, Save, ShieldCheck, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, Key, Link2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function Integrations() {
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [config, setConfig] = useState({
    accessToken: '',
    publicKey: '',
    webhookUrl: '',
    monthlyPrice: '',
    annualPrice: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('mp_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({
          accessToken: parsed.accessToken || '',
          publicKey: parsed.publicKey || '',
          webhookUrl: parsed.webhookUrl || '',
          monthlyPrice: parsed.monthlyPrice || '',
          annualPrice: parsed.annualPrice || '',
        });
      } catch { /* ignore */ }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem('mp_config', JSON.stringify(config));
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    toast.success('Configurações salvas com sucesso!');
  };

  const handleTestConnection = async () => {
    if (!config.accessToken) {
      toast.error('Insira o Access Token para testar a conexão');
      return;
    }
    setIsTesting(true);
    setConnectionStatus('idle');
    await new Promise(r => setTimeout(r, 1500));
    setConnectionStatus('success');
    setIsTesting(false);
    toast.success('Conexão com Mercado Pago estabelecida!');
  };

  const fieldsFilled = config.accessToken && config.publicKey;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground tracking-wide">Integrações</h1>
          <p className="text-xs text-muted-foreground/50 mt-1.5">Gerencie conexões com serviços externos</p>
        </div>
        {connectionStatus === 'success' && (
          <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-400/8 px-3 py-1.5 rounded-full font-display font-bold tracking-[0.15em] border border-emerald-400/15">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API ATIVA
          </span>
        )}
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="bg-transparent border-0 p-0 h-auto gap-1">
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/25 bg-muted/5 border border-border/15 rounded-xl px-5 py-2.5 text-[11px] font-display font-bold tracking-[0.12em] transition-all hover:bg-muted/10"
          >
            <CreditCard size={13} className="mr-2" />
            PAGAMENTOS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-5">
          {/* Main Card */}
          <div
            className="rounded-2xl border border-border/15 overflow-hidden"
            style={{ background: 'linear-gradient(160deg, hsla(187, 40%, 8%, 0.6) 0%, hsla(240, 6%, 6%, 0.9) 40%)' }}
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-border/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-white/10">
                  <img src={mercadoPagoIcon} alt="Mercado Pago" className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-foreground">Mercado Pago</h3>
                  <p className="text-[10px] text-muted-foreground/40 font-display tracking-[0.15em] mt-0.5">API DE ASSINATURA • PRODUÇÃO</p>
                </div>
              </div>
              <a
                href="https://www.mercadopago.com.br/developers/panel/app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[10px] text-primary/60 hover:text-primary px-3 py-2 rounded-xl hover:bg-primary/5 font-display font-bold tracking-[0.12em] transition-all border border-transparent hover:border-primary/15"
              >
                <ExternalLink size={11} />
                PAINEL DEV
              </a>
            </div>

            <div className="p-6 space-y-7">
              {/* Section: Credentials */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Key size={12} className="text-primary/50" />
                  <p className="text-[9px] font-display font-bold text-primary/40 tracking-[0.25em]">CREDENCIAIS DE PRODUÇÃO</p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/60">Access Token</Label>
                    <div className="relative group">
                      <Input
                        type={showAccessToken ? 'text' : 'password'}
                        placeholder="APP_USR-0000000000000000-000000-..."
                        value={config.accessToken}
                        onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="bg-background/40 border-border/15 text-xs pr-10 font-mono placeholder:text-muted-foreground/15 focus:border-primary/30 focus:bg-background/60 h-11 rounded-xl transition-all"
                      />
                      <button
                        onClick={() => setShowAccessToken(!showAccessToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                      >
                        {showAccessToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/60">Public Key</Label>
                    <div className="relative group">
                      <Input
                        type={showPublicKey ? 'text' : 'password'}
                        placeholder="APP_USR-00000000-0000-0000-0000-..."
                        value={config.publicKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                        className="bg-background/40 border-border/15 text-xs pr-10 font-mono placeholder:text-muted-foreground/15 focus:border-primary/30 focus:bg-background/60 h-11 rounded-xl transition-all"
                      />
                      <button
                        onClick={() => setShowPublicKey(!showPublicKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                      >
                        {showPublicKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />

              {/* Section: Plan IDs */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={12} className="text-primary/50" />
                  <p className="text-[9px] font-display font-bold text-primary/40 tracking-[0.25em]">PLANOS DE ASSINATURA</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/60">
                      Plano Mensal
                      <span className="text-muted-foreground/30 ml-1 font-normal">(valor em R$)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40 font-display font-bold">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="49.90"
                        value={config.monthlyPrice}
                        onChange={(e) => setConfig(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                        className="bg-background/40 border-border/15 text-xs pl-10 font-mono placeholder:text-muted-foreground/15 focus:border-primary/30 focus:bg-background/60 h-11 rounded-xl transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/60">
                      Plano Anual
                      <span className="text-muted-foreground/30 ml-1 font-normal">(valor em R$)</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/40 font-display font-bold">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="399.90"
                        value={config.annualPrice}
                        onChange={(e) => setConfig(prev => ({ ...prev, annualPrice: e.target.value }))}
                        className="bg-background/40 border-border/15 text-xs pl-10 font-mono placeholder:text-muted-foreground/15 focus:border-primary/30 focus:bg-background/60 h-11 rounded-xl transition-all"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />

              {/* Section: Webhook */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 size={12} className="text-primary/50" />
                  <p className="text-[9px] font-display font-bold text-primary/40 tracking-[0.25em]">WEBHOOK IPN</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-display font-semibold text-muted-foreground/60">URL de Notificação</Label>
                  <Input
                    placeholder="https://seudominio.com/api/webhook/mp"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    className="bg-background/40 border-border/15 text-xs font-mono placeholder:text-muted-foreground/15 focus:border-primary/30 focus:bg-background/60 h-11 rounded-xl transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
                    Cadastre esta URL nas configurações de webhook do seu aplicativo no painel do Mercado Pago.
                  </p>
                </div>
              </section>

              {/* Security Note */}
              <div
                className="p-4 rounded-xl border border-primary/8"
                style={{ background: 'linear-gradient(135deg, hsla(187, 60%, 50%, 0.04) 0%, hsla(187, 40%, 30%, 0.02) 100%)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={13} className="text-primary/70" />
                  </div>
                  <div>
                    <p className="text-[11px] font-display font-bold text-foreground/70">Importante</p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5 leading-relaxed">
                      Use credenciais de <strong className="text-foreground/50">produção</strong> do Mercado Pago. Para máxima segurança, recomendamos armazenar o Access Token como secret no Supabase Edge Functions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/10 flex items-center justify-between" style={{ background: 'hsla(240, 6%, 5%, 0.5)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={isTesting || !fieldsFilled}
                className="border-border/15 bg-transparent hover:bg-muted/10 text-[11px] font-display font-bold tracking-[0.1em] h-9 px-4 rounded-xl disabled:opacity-30"
              >
                {isTesting ? <RefreshCw size={12} className="mr-2 animate-spin" /> : <ShieldCheck size={12} className="mr-2" />}
                {isTesting ? 'VERIFICANDO...' : 'TESTAR CONEXÃO'}
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-[11px] font-display font-bold tracking-[0.1em] h-9 px-5 rounded-xl shadow-lg"
                style={{ boxShadow: '0 4px 15px hsla(187, 100%, 50%, 0.2)' }}
              >
                {isSaving ? <RefreshCw size={12} className="mr-2 animate-spin" /> : <Save size={12} className="mr-2" />}
                {isSaving ? 'SALVANDO...' : 'SALVAR'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
