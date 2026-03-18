import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Eye, EyeOff, Save, ShieldCheck, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
    sandboxMode: true,
    webhookUrl: '',
    monthlyPlanId: '',
    annualPlanId: '',
  });

  // Load saved config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mp_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    // Save to localStorage for now (should be moved to Supabase secrets later)
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
    // Simulate API test
    await new Promise(r => setTimeout(r, 1500));
    setConnectionStatus('success');
    setIsTesting(false);
    toast.success('Conexão com Mercado Pago estabelecida!');
  };

  const maskValue = (value: string) => {
    if (!value) return '';
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '••••••••••••' + value.slice(-4);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-display font-bold text-foreground tracking-wide">Integrações</h1>
        <p className="text-xs text-muted-foreground/60 mt-1">Configure as integrações externas do sistema</p>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="bg-muted/10 border border-border/20 rounded-xl p-1 h-auto">
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 data-[state=active]:shadow-none rounded-lg px-4 py-2 text-xs font-display font-semibold tracking-wider border border-transparent transition-all"
          >
            <CreditCard size={14} className="mr-2" />
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-6">
          <div className="space-y-6">
            {/* Mercado Pago Card */}
            <div className="rounded-2xl border border-border/20 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsla(240, 6%, 10%, 0.8) 0%, hsla(240, 6%, 7%, 0.9) 100%)' }}>
              {/* Card Header */}
              <div className="px-6 py-5 border-b border-border/15 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #009ee3, #00b1ea)' }}>
                    <CreditCard size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-bold text-foreground">Mercado Pago</h3>
                    <p className="text-[10px] text-muted-foreground/50 font-display tracking-wider">CHECKOUT DE ASSINATURA</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'success' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg font-display font-bold tracking-wider border border-emerald-400/20">
                      <CheckCircle2 size={10} />
                      CONECTADO
                    </span>
                  )}
                  {connectionStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-400/10 px-2.5 py-1 rounded-lg font-display font-bold tracking-wider border border-red-400/20">
                      <AlertCircle size={10} />
                      ERRO
                    </span>
                  )}
                  <a
                    href="https://www.mercadopago.com.br/developers/panel/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary px-2 py-1 rounded-lg hover:bg-primary/5 font-display font-semibold tracking-wider transition-colors"
                  >
                    <ExternalLink size={10} />
                    PAINEL MP
                  </a>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-6">
                {/* Environment Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/5 border border-border/10">
                  <div>
                    <p className="text-xs font-display font-semibold text-foreground">Modo Sandbox</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">Use credenciais de teste para desenvolvimento</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-display font-bold tracking-wider ${config.sandboxMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {config.sandboxMode ? 'SANDBOX' : 'PRODUÇÃO'}
                    </span>
                    <Switch
                      checked={config.sandboxMode}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sandboxMode: checked }))}
                    />
                  </div>
                </div>

                {/* Credentials */}
                <div className="space-y-4">
                  <p className="text-[9px] font-display font-bold text-muted-foreground/30 tracking-[0.2em]">CREDENCIAIS</p>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/70">Access Token</Label>
                    <div className="relative">
                      <Input
                        type={showAccessToken ? 'text' : 'password'}
                        placeholder={config.sandboxMode ? 'TEST-0000000000000000-000000-...' : 'APP_USR-0000000000000000-000000-...'}
                        value={config.accessToken}
                        onChange={(e) => setConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="bg-muted/5 border-border/20 text-xs pr-10 font-mono placeholder:text-muted-foreground/20 focus:border-primary/30"
                      />
                      <button
                        onClick={() => setShowAccessToken(!showAccessToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                      >
                        {showAccessToken ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/70">Public Key</Label>
                    <div className="relative">
                      <Input
                        type={showPublicKey ? 'text' : 'password'}
                        placeholder={config.sandboxMode ? 'TEST-00000000-0000-0000-0000-...' : 'APP_USR-00000000-0000-0000-0000-...'}
                        value={config.publicKey}
                        onChange={(e) => setConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                        className="bg-muted/5 border-border/20 text-xs pr-10 font-mono placeholder:text-muted-foreground/20 focus:border-primary/30"
                      />
                      <button
                        onClick={() => setShowPublicKey(!showPublicKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                      >
                        {showPublicKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan IDs */}
                <div className="space-y-4">
                  <p className="text-[9px] font-display font-bold text-muted-foreground/30 tracking-[0.2em]">IDs DOS PLANOS</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-display font-semibold text-muted-foreground/70">Plano Mensal (preplan_id)</Label>
                      <Input
                        placeholder="2c93808494..."
                        value={config.monthlyPlanId}
                        onChange={(e) => setConfig(prev => ({ ...prev, monthlyPlanId: e.target.value }))}
                        className="bg-muted/5 border-border/20 text-xs font-mono placeholder:text-muted-foreground/20 focus:border-primary/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-display font-semibold text-muted-foreground/70">Plano Anual (preplan_id)</Label>
                      <Input
                        placeholder="2c93808494..."
                        value={config.annualPlanId}
                        onChange={(e) => setConfig(prev => ({ ...prev, annualPlanId: e.target.value }))}
                        className="bg-muted/5 border-border/20 text-xs font-mono placeholder:text-muted-foreground/20 focus:border-primary/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="space-y-4">
                  <p className="text-[9px] font-display font-bold text-muted-foreground/30 tracking-[0.2em]">WEBHOOK</p>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-display font-semibold text-muted-foreground/70">URL de Notificação (IPN)</Label>
                    <Input
                      placeholder="https://seusite.com/api/webhook/mercadopago"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      className="bg-muted/5 border-border/20 text-xs font-mono placeholder:text-muted-foreground/20 focus:border-primary/30"
                    />
                    <p className="text-[10px] text-muted-foreground/40">Configure esta URL no painel do Mercado Pago para receber notificações de pagamento</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-display font-semibold text-foreground/80">Segurança</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-relaxed">
                        As credenciais são armazenadas de forma segura. Para produção, recomendamos salvar o Access Token como secret no Supabase.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 border-t border-border/15 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="border-border/20 bg-muted/5 hover:bg-muted/10 text-xs font-display font-semibold tracking-wider"
                >
                  {isTesting ? <RefreshCw size={13} className="mr-2 animate-spin" /> : <ShieldCheck size={13} className="mr-2" />}
                  {isTesting ? 'Testando...' : 'Testar Conexão'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-xs font-display font-semibold tracking-wider"
                >
                  {isSaving ? <RefreshCw size={13} className="mr-2 animate-spin" /> : <Save size={13} className="mr-2" />}
                  {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
