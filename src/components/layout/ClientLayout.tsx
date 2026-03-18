import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, LayoutGrid, Clock, User, LogOut, Menu, X } from 'lucide-react';
import logo from '@/assets/logo.png';

const navItems = [
  { label: 'Sinais', icon: Zap, path: '/client' },
  { label: 'Catálogo', icon: LayoutGrid, path: '/client/catalog' },
  { label: 'Histórico', icon: Clock, path: '/client/history' },
  { label: 'Perfil', icon: User, path: '/client/profile' },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header - mobile */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, hsla(240,6%,7%,0.95) 0%, hsla(345,100%,50%,0.05) 50%, hsla(187,100%,50%,0.05) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, hsla(345,100%,50%,0.1) 0%, transparent 30%, transparent 70%, hsla(187,100%,50%,0.1) 100%)' }} />
        <div className="flex items-center gap-2 relative z-10">
          <img src={logo} alt="P-CON FLUX" className="w-8 h-8 object-contain" />
          <span className="font-display text-sm font-bold text-foreground tracking-wider">FLUX</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground p-1 relative z-10 hover:text-primary transition-colors">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile slide menu */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)}>
          <div
            className="w-72 h-full border-r border-border/50 p-5 animate-slide-up relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, hsla(240,6%,7%,0.98) 0%, hsla(345,100%,50%,0.04) 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-secondary/40 via-primary/20 to-transparent" />
            <div className="flex items-center gap-3 mb-8">
              <img src={logo} alt="P-CON FLUX" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-display text-sm font-bold text-foreground block tracking-wider">P-CON FLUX</span>
                <span className="text-[10px] text-muted-foreground">Painel do Cliente</span>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border border-primary/20 glow-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="absolute bottom-6 left-5 right-5">
              <div className="border-t border-border/50 pt-4">
                <div className="text-xs text-muted-foreground mb-1">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground/60 mb-3">{user?.email}</div>
                <button onClick={logout} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors">
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col w-64 border-r border-border/50 p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, hsla(240,6%,7%,0.98) 0%, hsla(345,100%,50%,0.03) 50%, hsla(187,100%,50%,0.03) 100%)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-secondary/40 via-primary/20 to-transparent" />
          <div className="absolute bottom-0 left-0 top-0 w-px bg-gradient-to-b from-secondary/20 via-transparent to-primary/20" />

          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="P-CON FLUX" className="w-10 h-10 object-contain" />
            <div>
              <span className="font-display text-sm font-bold text-foreground block tracking-wider">P-CON FLUX</span>
              <span className="text-[10px] text-muted-foreground">Painel do Cliente</span>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm transition-all ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary border border-primary/20 glow-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="border-t border-border/50 pt-4">
            <div className="text-xs text-muted-foreground mb-1">{user?.name}</div>
            <div className="text-[10px] text-muted-foreground/60 mb-3">{user?.email}</div>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto relative">
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: 'radial-gradient(ellipse at 80% 20%, hsla(187,100%,50%,0.04) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, hsla(345,100%,50%,0.04) 0%, transparent 50%)' }}
          />
          <div className="relative z-10">{children}</div>
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 flex justify-around py-1.5 z-40 backdrop-blur-xl"
        style={{ background: 'linear-gradient(180deg, hsla(240,6%,7%,0.92) 0%, hsla(240,6%,5%,0.98) 100%)' }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        {navItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] transition-all rounded-lg ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg transition-all ${isActive(item.path) ? 'bg-primary/10 glow-primary' : ''}`}>
              <item.icon size={20} />
            </div>
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
