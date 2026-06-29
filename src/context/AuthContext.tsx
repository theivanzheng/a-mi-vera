import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  /** Envía el correo de recuperación. Devuelve null si OK, o un mensaje de error. */
  requestPasswordReset: (email: string) => Promise<string | null>;
  /** Fija una contraseña nueva (en la sesión de recuperación o ya autenticado). */
  updatePassword: (newPassword: string) => Promise<string | null>;
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

  // Envía el correo con el enlace de recuperación. Por seguridad, Supabase
  // responde OK aunque el email no exista (no revela qué correos hay dados de alta).
  async function requestPasswordReset(email: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) {
      return 'La recuperación por correo requiere Supabase configurado.';
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    if (!error) return null;
    const code = error.message.toLowerCase();
    if (code.includes('rate limit') || code.includes('too many')) {
      return 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.';
    }
    return 'No se pudo enviar el correo. Inténtalo de nuevo en unos minutos.';
  }

  // Fija la contraseña nueva. Funciona con la sesión temporal de recuperación.
  async function updatePassword(newPassword: string): Promise<string | null> {
    if (!isSupabaseConfigured || !supabase) {
      return 'Esta función requiere Supabase configurado.';
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) return null;
    const code = error.message.toLowerCase();
    if (code.includes('session') || code.includes('not authenticated') || code.includes('jwt')) {
      return 'El enlace ha caducado o no es válido. Solicita uno nuevo.';
    }
    if (code.includes('at least') || code.includes('weak') || code.includes('password')) {
      return 'La contraseña no cumple los requisitos (mínimo 6 caracteres).';
    }
    return 'No se pudo actualizar la contraseña. Inténtalo de nuevo.';
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, requestPasswordReset, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
