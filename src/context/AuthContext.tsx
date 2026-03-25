import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { registerUser, loginUser, getDatabase } from '../lib/database';

export interface User {
  id: number;
  username: string;
  role: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isMasterAuth: boolean;
  dbReady: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  masterLogin: (password: string) => boolean;
  logout: () => void;
}

const MASTER_PASSWORD = 'thugshaka';
const AUTH_KEY = 'orc-auth-session';

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isMasterAuth, setIsMasterAuth] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // Init database — now instant, no WASM
  useEffect(() => {
    getDatabase().then(() => {
      setDbReady(true);
      try {
        const saved = sessionStorage.getItem(AUTH_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.master) {
            setIsMasterAuth(true);
            setUser({ id: 0, username: 'master_admin', role: 'superadmin', avatar: '' });
          } else if (parsed.user) {
            setUser(parsed.user);
          }
        }
      } catch { /* ignore */ }
    }).catch(err => {
      console.error('DB init failed:', err);
      setDbReady(true);
    });
  }, []);

  const saveSession = (data: any) => {
    try { sessionStorage.setItem(AUTH_KEY, JSON.stringify(data)); } catch { /* */ }
  };

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginUser(username, password);
    if (result.success && result.user) {
      setUser(result.user);
      setIsMasterAuth(false);
      saveSession({ user: result.user });
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const result = await registerUser(username, password);
    if (result.success) {
      const loginResult = await loginUser(username, password);
      if (loginResult.success && loginResult.user) {
        setUser(loginResult.user);
        saveSession({ user: loginResult.user });
      }
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const masterLogin = useCallback((password: string) => {
    if (password === MASTER_PASSWORD) {
      setIsMasterAuth(true);
      setUser({ id: 0, username: 'master_admin', role: 'superadmin', avatar: '' });
      saveSession({ master: true });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsMasterAuth(false);
    sessionStorage.removeItem(AUTH_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isMasterAuth,
      dbReady,
      login,
      register,
      masterLogin,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
