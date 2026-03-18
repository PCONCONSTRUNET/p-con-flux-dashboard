import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { User, Mail, LogOut, Phone, Send, Save, Check, Clock, Crown, Zap, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const planConfig = {
  trial: { label: 'Teste Grátis (3h)', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Clock },
  monthly: { label: 'P-CON FLUX Mensal', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: Zap },
  annual: { label: 'P-CON FLUX Anual', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: Crown },
};

const Profile = () => {
  const { user, logout } = useAuth();
  const { subscription } = useSubscription();
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('whatsapp, telegram')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setWhatsapp(data.whatsapp || '');
        setTelegram(data.telegram || '');
      }
      setLoaded(true);
    };
    fetchProfile();
  }, [user]);

  const handleSaveContacts = async () => {
    if (!user) return;
    setSaving(true);
    const cleanWhatsapp = whatsapp.trim().slice(0, 20);
    const cleanTelegram = telegram.trim().slice(0, 50);

    const { error } = await supabase
      .from('profiles')
      .update({ whatsapp: cleanWhatsapp, telegram: cleanTelegram, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar contatos');
    } else {
      setSaved(true);
      toast.success('Contatos salvos com sucesso!');
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const plan = subscription ? planConfig[subscription.plan] : planConfig.trial;
  const PlanIcon = plan.icon;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Gerencie suas informações</p>
      </div>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4 bg-card/60 backdrop-blur-xl rounded-2xl p-5 border border-border/30">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
          <User size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
          <span className="text-[10px] font-semibold tracking-widest uppercase bg-primary/15 text-primary px-2.5 py-0.5 rounded-lg border border-primary/20">
            CLIENTE
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20">
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <User size={18} className="text-muted-foreground/60" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Nome</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20">
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <Mail size={18} className="text-muted-foreground/60" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Email</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Plan */}
        <div className={`flex items-center gap-4 backdrop-blur-sm rounded-2xl p-4 border ${subscription?.isExpired ? 'border-secondary/20 bg-secondary/10' : `${plan.border} ${plan.bg}`}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${subscription?.isExpired ? 'bg-secondary/10 border border-secondary/20' : `${plan.bg} border ${plan.border}`}`}>
            {subscription?.isExpired ? <AlertTriangle size={18} className="text-secondary" /> : <PlanIcon size={18} className={plan.color} />}
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Plano</p>
            <p className={`text-sm font-bold mt-0.5 ${subscription?.isExpired ? 'text-secondary' : plan.color}`}>
              {subscription?.isExpired ? `${plan.label} — Expirado` : plan.label}
            </p>
          </div>
        </div>

        {/* Subscription Time */}
        <div className={`flex items-center gap-4 backdrop-blur-sm rounded-2xl p-4 border ${subscription?.isExpired ? 'border-secondary/20 bg-secondary/5' : 'border-border/20 bg-card/40'}`}>
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <Calendar size={18} className="text-muted-foreground/60" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Tempo Restante</p>
            <p className={`text-sm font-bold mt-0.5 ${subscription?.isExpired ? 'text-secondary' : 'text-emerald-400'}`}>
              {subscription?.isExpired ? '⚠ Plano Expirado' : subscription ? `⏱ ${subscription.timeRemaining}` : '⚠ Sem plano ativo'}
            </p>
            {subscription && (
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                {subscription.isExpired ? 'Expirou' : 'Expira'}: {new Date(subscription.expires_at).toLocaleDateString('pt-BR')} às {new Date(subscription.expires_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contacts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Phone size={14} className="text-primary" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Contatos</h3>
          <span className="text-[9px] text-muted-foreground/40 ml-1">(opcional)</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 focus-within:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Phone size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">WhatsApp</p>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
                maxLength={20}
                className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/25 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 focus-within:border-blue-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Send size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold mb-1">Telegram</p>
              <input
                type="text"
                value={telegram}
                onChange={e => setTelegram(e.target.value)}
                placeholder="@seuusuario"
                maxLength={50}
                className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/25 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveContacts}
          disabled={saving || !loaded}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-200 ${
            saved
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20'
          }`}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : saved ? (
            <><Check size={16} /> Salvo!</>
          ) : (
            <><Save size={16} /> Salvar Contatos</>
          )}
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-secondary/8 border border-secondary/20 text-secondary font-semibold text-sm tracking-wide hover:bg-secondary/15 transition-all duration-200"
      >
        <LogOut size={16} />
        SAIR DA CONTA
      </button>
    </div>
  );
};

export default Profile;
