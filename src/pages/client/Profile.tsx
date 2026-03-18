import { useAuth } from '@/contexts/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-foreground">Perfil</h1>

      <div className="card-glass rounded-lg p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Nome</label>
          <p className="text-foreground">{user?.name}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Email</label>
          <p className="text-foreground">{user?.email}</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Perfil</label>
          <p className="text-primary font-display text-sm">CLIENTE</p>
        </div>
      </div>

      <button onClick={logout} className="w-full py-3 rounded-md bg-secondary/10 border border-secondary/20 text-secondary font-display text-sm tracking-wider hover:bg-secondary/20 transition-colors">
        SAIR DA CONTA
      </button>
    </div>
  );
};

export default Profile;
