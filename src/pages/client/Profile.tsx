import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, LogOut, ChevronRight } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground/70 mt-1">Gerencie suas informações</p>
      </div>

      {/* Avatar + Name Card */}
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
        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 hover:border-border/40 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <User size={18} className="text-muted-foreground/60" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Nome</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user?.name}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/20" />
        </div>

        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 hover:border-border/40 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
            <Mail size={18} className="text-muted-foreground/60" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Email</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{user?.email}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/20" />
        </div>

        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-sm rounded-2xl p-4 border border-border/20 hover:border-border/40 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield size={18} className="text-primary/60" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">Plano</p>
            <p className="text-sm font-bold text-primary mt-0.5">Premium</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/20" />
        </div>
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
