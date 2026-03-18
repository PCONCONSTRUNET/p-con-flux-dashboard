import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Informe seu email.'); return; }
    setError('');
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-[120px]" style={{ background: 'hsl(187 100% 50%)' }} />

      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="P-CON FLUX" className="w-32 h-32 object-contain" />
        </div>

        <div className="card-glass rounded-lg p-8">
          <h1 className="text-xl font-display font-bold text-center mb-2 text-foreground">
            Recuperar Senha
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Informe seu email para receber instruções de recuperação.
          </p>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="text-primary text-glow-primary text-sm">
                ✓ Instruções enviadas para {email}
              </div>
              <button onClick={() => navigate('/login')} className="text-sm text-primary hover:underline">
                Voltar ao login
              </button>
            </div>
          ) : (
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
              {error && (
                <div className="text-sm text-secondary bg-secondary/10 border border-secondary/20 rounded-md px-3 py-2">{error}</div>
              )}
              <button type="submit" className="w-full py-3 rounded-md bg-primary text-primary-foreground font-display font-semibold text-sm tracking-wider hover:opacity-90 active:scale-[0.98] transition-all glow-primary">
                ENVIAR
              </button>
              <button type="button" onClick={() => navigate('/login')} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
