import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Página de restablecimiento de contraseña (`/restablecer`).
 *
 * Es la URL a la que apunta el enlace del correo de recuperación. Supabase
 * (con detectSessionInUrl) procesa el token del enlace y crea una sesión
 * temporal de recuperación → entonces se permite fijar la contraseña nueva.
 */
type Phase = 'checking' | 'ready' | 'invalid' | 'done';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [phase, setPhase] = useState<Phase>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detecta la sesión de recuperación creada al abrir el enlace del correo.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setPhase('invalid'); return; }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setPhase('ready');
    });

    // Por si la sesión ya está establecida al montar (el hash se procesó antes).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) {
        setPhase('ready');
      } else {
        // Da margen a que se procese el token del enlace; si no aparece, inválido.
        setTimeout(() => {
          if (active) setPhase(p => (p === 'checking' ? 'invalid' : p));
        }, 2500);
      }
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

    setSubmitting(true);
    const errorMsg = await updatePassword(password);
    setSubmitting(false);

    if (errorMsg) { setError(errorMsg); return; }
    setPhase('done');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-name">A Mi Vera</span>
          <span className="login-logo-sub">Restablecer contraseña</span>
        </div>

        {phase === 'checking' && <p className="login-help">Validando el enlace…</p>}

        {phase === 'invalid' && (
          <>
            <p className="login-error">
              El enlace no es válido o ha caducado. Solicita uno nuevo desde la pantalla de
              inicio de sesión.
            </p>
            <Link to="/login" className="login-btn login-btn--link">
              Volver al inicio de sesión
            </Link>
          </>
        )}

        {phase === 'ready' && (
          <form onSubmit={handleSubmit} className="login-form">
            <p className="login-help">Escribe tu nueva contraseña.</p>

            <div className="login-field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={submitting}
              />
            </div>

            <div className="login-field">
              <label htmlFor="confirm-password">Repite la contraseña</label>
              <input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.currentTarget.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                disabled={submitting}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}

        {phase === 'done' && (
          <>
            <p className="login-success">Contraseña actualizada correctamente.</p>
            <button
              type="button"
              className="login-btn"
              onClick={() => navigate('/admin/dashboard', { replace: true })}
            >
              Entrar al panel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
