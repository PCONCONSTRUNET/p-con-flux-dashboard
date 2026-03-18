import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';
import LoginBackground from '@/components/LoginBackground';

type Mode = 'login' | 'register';

const Login = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Informe seu email.'); return; }
    if (!password.trim()) { setError('Informe sua senha.'); return; }
    const ok = await login(email, password, remember);
    if (!ok) {
      setError('Email ou senha incorretos.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Informe seu nome.'); return; }
    if (!email.trim()) { setError('Informe seu email.'); return; }
    if (password.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }

    const result = await register(name, email, password);
    if (!result.ok) {
      setError(result.error || 'Erro ao cadastrar.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 pb-24 relative overflow-hidden">
      <LoginBackground />

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        <div className="flex flex-col items-center mb-5">
          <img src={logo} alt="P-CON FLUX" className="w-28 h-28 object-contain mb-1" />
        </div>

        <div className="rounded-2xl p-6 border border-foreground/15 backdrop-blur-2xl shadow-[0_0_40px_hsla(345,100%,50%,0.25),0_0_80px_hsla(187,100%,50%,0.08)] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsla(345, 100%, 50%, 0.22) 0%, hsla(240, 6%, 10%, 0.7) 35%, hsla(240, 6%, 12%, 0.65) 65%, hsla(187, 100%, 50%, 0.08) 100%)' }}>
          {/* Glass shine effect */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(105deg, hsla(0, 0%, 100%, 0.08) 0%, transparent 40%, transparent 60%, hsla(0, 0%, 100%, 0.04) 100%)' }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          <div className="relative z-10">
          {/* Tabs */}
          <div className="flex mb-4 border-b border-border">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 pb-2 text-xs font-display font-semibold tracking-wider transition-colors relative ${
                mode === 'login'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ENTRAR
              {mode === 'login' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 pb-2 text-xs font-display font-semibold tracking-wider transition-colors relative ${
                mode === 'register'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              CADASTRAR
              {mode === 'register' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary glow-primary" />
              )}
            </button>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-neon"
                  placeholder="seu@email.com"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-border bg-muted accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">Lembrar acesso</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-primary hover:underline"
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
                className="w-full py-2.5 rounded-[16px] text-white font-display font-semibold text-xs tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 hover:animate-pulse-glow hover:bg-right"
                style={{ backgroundImage: 'linear-gradient(30deg, #0400ff, #4ce3f7)', backgroundSize: '100% auto', transition: 'background-size 0.3s, background-position 0.3s' }}
              >
                {loading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-neon"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-neon"
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-muted/60 border border-border/60 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50 transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-muted/60 border border-border/60 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50 transition-all"
                  placeholder="Repita a senha"
                />
              </div>

              {error && (
                <div className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-md px-3 py-1.5">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-xs text-primary bg-primary/10 border border-primary/20 rounded-md px-3 py-1.5">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-[16px] text-white font-display font-semibold text-xs tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 hover:animate-pulse-glow hover:bg-right"
                style={{ backgroundImage: 'linear-gradient(30deg, #0400ff, #4ce3f7)', backgroundSize: '100% auto', transition: 'background-size 0.3s, background-position 0.3s' }}
              >
                {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>

      {/* Legal Banner +18 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center pb-4 px-4">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border border-foreground/15 backdrop-blur-sm bg-background/30">
          <div className="flex-shrink-0">
            <svg width="30" height="30" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="30" cy="30" r="28" stroke="hsl(var(--foreground))" strokeWidth="3" fill="none" />
              <text x="30" y="34" textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--foreground))" fontSize="20" fontWeight="700" fontFamily="sans-serif">18</text>
              <text x="47" y="14" textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--foreground))" fontSize="14" fontWeight="700" fontFamily="sans-serif">+</text>
            </svg>
          </div>
          <div className="flex flex-col gap-0">
            <p className="text-[10px] sm:text-[11px] text-foreground/80">Promoções sujeitas a termos e condições</p>
            <p className="text-[10px] sm:text-[11px] text-foreground font-bold">Jogue com responsabilidade, não há garantia de ganhos.</p>
            <p className="text-[10px] sm:text-[11px] text-foreground/80">Apenas para maiores de 18 anos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
