// Teacher session state shared across the dashboard.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api.ts';
import type { PublicUser } from '../../shared/schema.ts';
import { Spinner } from './ui/kit.tsx';

interface AuthState {
  user: PublicUser | null;
  ready: boolean;
  setUser: (u: PublicUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false, setUser: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api<{ user: PublicUser | null }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);
  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, ready, setUser, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Spinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}
