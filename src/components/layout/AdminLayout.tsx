import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Layers, Users, BarChart3, LogOut, Menu, X, Clock, Shield, UserCheck } from 'lucide-react';
import logo from '@/assets/logo.png';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Padrões', icon: Layers, path: '/admin/patterns' },
  { label: 'Catálogo Ao Vivo', icon: BarChart3, path: '/admin/catalog' },
  { label: 'Histórico', icon: Clock, path: '/admin/history' },
  { label: 'Usuários', icon: Users, path: '/admin/users' },
  { label: 'Clientes', icon: UserCheck, path: '/admin/clients' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[180px]" style={{ background: 'hsl(187, 100%, 50%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[150px]" style={{ background: 'hsl(345, 100%, 50%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.02] blur-[200px]" style={{ background: 'hsl(270, 80%, 50%)' }} />
      </div>

      {/* Top header - mobile */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/50 relative z-10" style={{ background: 'linear-gradient(135deg, hsla(240, 6%, 8%, 0.95) 0%, hsla(240, 6%, 6%, 0.95) 100%)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2">
          <img src={logo} alt="P-CON FLUX" className="w-8 h-8 object-contain" />
          <span className="font-display text-xs font-bold text-foreground">P-CON FLUX</span>
          <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display border border-secondary/30">ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground p-1">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile slide menu */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <div
            className="w-64 h-full border-r border-border/50 p-4 animate-slide-up"
            style={{ background: 'linear-gradient(180deg, hsla(240, 6%, 8%, 0.98) 0%, hsla(240, 6%, 5%, 0.98) 100%)', backdropFilter: 'blur(20px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-8">
              <img src={logo} alt="P-CON FLUX" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-display text-sm font-bold text-foreground block">P-CON FLUX</span>
                <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display border border-secondary/30">ADMIN</span>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary glow-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="font-display text-xs tracking-wider">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Shield size={14} className="text-secondary" />
                <span className="text-xs text-muted-foreground">{user?.name}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors px-1">
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 relative z-10">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col w-60 border-r border-border/50 p-4"
          style={{ background: 'linear-gradient(180deg, hsla(240, 6%, 8%, 0.95) 0%, hsla(240, 6%, 5%, 0.95) 100%)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2 mb-8">
            <img src={logo} alt="P-CON FLUX" className="w-10 h-10 object-contain" />
            <div>
              <span className="font-display text-sm font-bold text-foreground block">P-CON FLUX</span>
              <span className="text-[9px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display border border-secondary/30 glow-secondary">ADMIN</span>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary glow-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon size={18} />
                <span className="font-display text-xs tracking-wider">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Shield size={14} className="text-secondary" />
              <span className="text-xs text-muted-foreground">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors px-1">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
