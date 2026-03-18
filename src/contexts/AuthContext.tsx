import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: { email: string; password: string; user: User }[] = [
  {
    email: 'admin@pconflux.com',
    password: 'admin123',
    user: { id: '1', name: 'Administrador', email: 'admin@pconflux.com', role: 'admin' },
  },
  {
    email: 'cliente@pconflux.com',
    password: 'cliente123',
    user: { id: '2', name: 'Cliente Demo', email: 'cliente@pconflux.com', role: 'client' },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('pcon_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    setLoading(false);
    if (found) {
      setUser(found.user);
      if (remember) {
        localStorage.setItem('pcon_user', JSON.stringify(found.user));
      } else {
        sessionStorage.setItem('pcon_user', JSON.stringify(found.user));
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pcon_user');
    sessionStorage.removeItem('pcon_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
