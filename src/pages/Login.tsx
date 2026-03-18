import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Informe seu email.'); return; }
    if (!password.trim()) { setError('Informe sua senha.'); return; }
    const ok = await login(email, password, remember);
    if (!ok) {
      setError('Email ou senha incorretos.');
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: 'hsl(187 100% 50%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-15 blur-[120px]" style={{ background: 'hsl(345 100% 50%)' }} />

      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="P-CON FLUX" className="w-40 h-40 object-contain mb-2" />
        </div>

        <div className="card-glass rounded-lg p-8">
          <h1 className="text-xl font-display font-bold text-center mb-6 text-foreground">
            Acesse sua conta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-muted accent-primary"
                />
                <span className="text-sm text-muted-foreground">Lembrar acesso</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary hover:underline"
              >
                Esqueci a senha
              </button>
            </div>

            {error && (
              <div className="text-sm text-secondary bg-secondary/10 border border-secondary/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold text-sm tracking-wider hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 glow-primary"
            >
              {loading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo: admin@pconflux.com / admin123 <br />
            ou cliente@pconflux.com / cliente123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
