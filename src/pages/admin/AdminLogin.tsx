import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import LoginBackground from '@/components/LoginBackground';

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

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        <div className="flex flex-col items-center mb-5">
          <img src={logo} alt="P-CON FLUX" className="w-28 h-28 object-contain mb-1" />
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-display tracking-widest uppercase border border-secondary/30 glow-secondary">
              Painel Administrativo
            </span>
          </div>
        </div>

        <div
          className="rounded-3xl p-6 border border-foreground/15 backdrop-blur-2xl shadow-[0_0_40px_hsla(345,100%,50%,0.25),0_0_80px_hsla(187,100%,50%,0.08)] relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, hsla(345, 100%, 50%, 0.22) 0%, hsla(240, 6%, 10%, 0.7) 35%, hsla(240, 6%, 12%, 0.65) 65%, hsla(187, 100%, 50%, 0.08) 100%)',
          }}
        >
          {/* Glass shine effect */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, hsla(0, 0%, 100%, 0.08) 0%, transparent 40%, transparent 60%, hsla(0, 0%, 100%, 0.04) 100%)',
            }}
          />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />

          <div className="relative z-10">
            <h2 className="text-center text-sm font-display font-bold text-foreground tracking-wider mb-4">
              ACESSO ADMINISTRATIVO
            </h2>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-neon"
                  placeholder="admin@pconflux.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-neon"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm text-secondary bg-secondary/10 border border-secondary/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[16px] text-white font-display font-semibold text-xs tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 hover:animate-pulse-glow hover:bg-right"
                style={{
                  backgroundImage: 'linear-gradient(30deg, #0400ff, #4ce3f7)',
                  backgroundSize: '100% auto',
                  transition: 'background-size 0.3s, background-position 0.3s',
                }}
              >
                {loading ? 'ENTRANDO...' : 'ACESSAR PAINEL'}
              </button>
            </form>

            <button
              onClick={() => navigate('/login')}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← Voltar ao login de cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
