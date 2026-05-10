import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(localStorage.getItem('amivera_admin_session') === 'true');
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback: cualquier credencial entra (solo dev sin Supabase)
      localStorage.setItem('amivera_admin_session', 'true');
      setIsAuthenticated(true);
      return null;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return null;

    // Mensajes de error en español
    const code = error.message.toLowerCase();
    if (code.includes('invalid login credentials') || code.includes('invalid_credentials')) {
      return 'Correo electrónico o contraseña incorrectos.';
    }
    if (code.includes('email not confirmed')) {
      return 'La cuenta no ha sido confirmada. Revisa tu correo.';
    }
    if (code.includes('too many requests') || code.includes('rate limit')) {
      return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    }
    return 'Error al iniciar sesión. Inténtalo de nuevo.';
  }

  async function logout(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      localStorage.removeItem('amivera_admin_session');
      setIsAuthenticated(false);
      return;
    }
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
