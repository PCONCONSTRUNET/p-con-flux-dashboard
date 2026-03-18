import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Layers, Users, BarChart3, LogOut, Menu, X, Settings } from 'lucide-react';
import logo from '@/assets/logo.png';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Padrões', icon: Layers, path: '/admin/patterns' },
  { label: 'Catálogo Ao Vivo', icon: BarChart3, path: '/admin/catalog' },
  { label: 'Histórico', icon: Settings, path: '/admin/history' },
  { label: 'Usuários', icon: Users, path: '/admin/users' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header - mobile */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src={logo} alt="P-CON FLUX" className="w-8 h-8 object-contain" />
          <span className="font-display text-xs font-bold text-foreground">P-CON FLUX</span>
          <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display">ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground p-1">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Mobile slide menu */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-card border-r border-border p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-8">
              <img src={logo} alt="P-CON FLUX" className="w-10 h-10 object-contain" />
              <div>
                <span className="font-display text-sm font-bold text-foreground block">P-CON FLUX</span>
                <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display">ADMIN</span>
              </div>
            </div>
            <nav className="space-y-1">
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-xs text-muted-foreground mb-2">{user?.name}</div>
              <button onClick={logout} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors">
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-8">
            <img src={logo} alt="P-CON FLUX" className="w-10 h-10 object-contain" />
            <div>
              <span className="font-display text-sm font-bold text-foreground block">P-CON FLUX</span>
              <span className="text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-display">ADMIN</span>
            </div>
          </div>
          <nav className="space-y-1 flex-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm transition-colors ${isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="border-t border-border pt-4">
            <div className="text-xs text-muted-foreground mb-2">{user?.name}</div>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
