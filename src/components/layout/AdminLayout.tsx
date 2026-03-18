import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Layers, LogOut, Menu, X, Shield, UserCheck, CreditCard, Activity, ChevronRight, Plug } from 'lucide-react';
import logo from '@/assets/logo.png';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Padrões', icon: Layers, path: '/admin/patterns' },
  { label: 'Fluxo', icon: Activity, path: '/admin/pattern-flow' },
  { label: 'Clientes', icon: UserCheck, path: '/admin/clients' },
  { label: 'Pagamentos', icon: CreditCard, path: '/admin/payments' },
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

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo Section */}
      <div className="px-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="P-CON FLUX" className="w-11 h-11 object-contain" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <span className="font-display text-sm font-bold text-foreground block tracking-wide">P-CON FLUX</span>
            <span
              className="inline-flex items-center text-[8px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-md font-display font-bold tracking-[0.15em] border border-secondary/25 mt-0.5"
              style={{ boxShadow: '0 0 12px hsla(345, 100%, 50%, 0.15)' }}
            >
              ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 mb-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Nav Label */}
      <p className="px-4 text-[9px] font-display font-bold text-muted-foreground/30 tracking-[0.2em] mb-2">MENU</p>

      {/* Navigation */}
      <nav className="space-y-1 flex-1 px-2">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onNavigate?.(); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/20'
              }`}
            >
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  style={{ boxShadow: '0 0 8px hsla(187, 100%, 50%, 0.5)' }}
                />
              )}

              {/* Active background */}
              {active && (
                <div
                  className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15"
                  style={{ boxShadow: 'inset 0 1px 0 hsla(187, 100%, 50%, 0.05)' }}
                />
              )}

              <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                active ? 'bg-primary/15' : 'bg-muted/10 group-hover:bg-muted/20'
              }`}>
                <item.icon size={16} className={active ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-foreground/70'} />
              </div>
              <span className={`relative z-10 font-display text-[11px] font-semibold tracking-wider ${active ? 'text-primary' : ''}`}>
                {item.label}
              </span>
              {active && <ChevronRight size={12} className="ml-auto text-primary/50 relative z-10" />}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 mt-auto mb-3">
        <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      </div>

      {/* User Section */}
      <div className="px-3 pb-1">
        <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl bg-muted/8 border border-border/15 mb-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Shield size={14} className="text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-display font-bold text-foreground truncate">{user?.name || 'Admin'}</p>
            <p className="text-[9px] text-muted-foreground/40 font-display tracking-wider">ADMINISTRADOR</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-secondary/70 hover:text-secondary hover:bg-secondary/5 transition-all duration-200"
        >
          <LogOut size={14} />
          <span className="text-[11px] font-display font-semibold tracking-wider">Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04] blur-[180px]" style={{ background: 'hsl(187, 100%, 50%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03] blur-[150px]" style={{ background: 'hsl(345, 100%, 50%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.02] blur-[200px]" style={{ background: 'hsl(270, 80%, 50%)' }} />
      </div>

      {/* Top header - mobile */}
      <header
        className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/30 relative z-10"
        style={{ background: 'linear-gradient(135deg, hsla(240, 6%, 7%, 0.98) 0%, hsla(240, 6%, 5%, 0.98) 100%)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="P-CON FLUX" className="w-9 h-9 object-contain" />
          <span className="font-display text-xs font-bold text-foreground tracking-wide">P-CON FLUX</span>
          <span
            className="text-[8px] bg-secondary/15 text-secondary px-1.5 py-0.5 rounded-md font-display font-bold tracking-[0.12em] border border-secondary/25"
            style={{ boxShadow: '0 0 10px hsla(345, 100%, 50%, 0.15)' }}
          >
            ADMIN
          </span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground/60 hover:text-foreground p-1.5 rounded-lg hover:bg-muted/20 transition-colors">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile slide menu */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-md" onClick={() => setSidebarOpen(false)}>
          <div
            className="w-[270px] h-full flex flex-col border-r border-border/30 py-5 animate-slide-up"
            style={{ background: 'linear-gradient(180deg, hsla(240, 6%, 7%, 0.99) 0%, hsla(240, 6%, 4%, 0.99) 100%)', backdropFilter: 'blur(30px)' }}
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 relative z-10 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className="hidden lg:flex flex-col w-[240px] border-r border-border/20 py-5 h-screen sticky top-0"
          style={{
            background: 'linear-gradient(180deg, hsla(240, 6%, 7%, 0.97) 0%, hsla(240, 6%, 4%, 0.97) 100%)',
            backdropFilter: 'blur(30px)',
            boxShadow: '1px 0 20px hsla(0,0%,0%,0.3)',
          }}
        >
          <SidebarContent />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
