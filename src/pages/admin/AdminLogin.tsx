import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import LoginBackground from '@/components/LoginBackground';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Informe seu email.'); return; }
    if (!password.trim()) { setError('Informe sua senha.'); return; }
    const ok = await login(email, password, true);
    if (!ok) {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <LoginBackground />

      <div className="w-full max-w-[360px] animate-slide-up relative z-10">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="P-CON FLUX" className="w-24 h-24 object-contain mb-2" />
          <div className="flex items-center gap-1.5 mt-1">
            <Shield size={12} className="text-secondary" />
            <span className="text-[11px] text-secondary font-body font-medium tracking-wide">
              Área restrita
            </span>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border border-border/60 backdrop-blur-xl relative overflow-hidden"
          style={{
            background: 'hsla(240, 6%, 7%, 0.85)',
            boxShadow: '0 8px 32px hsla(0, 0%, 0%, 0.4)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="relative z-10">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5 tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-neon"
                  placeholder="admin@pconflux.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5 tracking-wide">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-neon"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-foreground font-body font-semibold text-xs tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 border border-primary/30 hover:border-primary/60 bg-primary/10 hover:bg-primary/15"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </form>

            <button
              onClick={() => navigate('/login')}
              className="w-full mt-4 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors text-center"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
