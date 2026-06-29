import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const { login, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const errorMsg = await login(email, password);

    if (errorMsg) {
      setError(errorMsg);
      setSubmitting(false);
      return;
    }

    navigate('/admin/dashboard', { replace: true });
  }

  async function handleRecover(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const errorMsg = await requestPasswordReset(email);
    setSubmitting(false);

    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setInfo(
      'Si existe una cuenta con ese correo, te hemos enviado un enlace para crear una ' +
      'contraseña nueva. Revisa tu bandeja de entrada (y la carpeta de spam).',
    );
  }

  function switchMode(next: 'login' | 'recover') {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-name">A Mi Vera</span>
          <span className="login-logo-sub">Panel de administración</span>
        </div>

        {!isSupabaseConfigured && (
          <div className="login-warning">
            Modo desarrollo sin Supabase. Cualquier credencial permite el acceso.
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                placeholder="admin@amivera.es"
                required
                autoComplete="email"
                disabled={submitting}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={submitting}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>

            <button
              type="button"
              className="login-link"
              onClick={() => switchMode('recover')}
              disabled={submitting}
            >
              ¿Has olvidado tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecover} className="login-form">
            <p className="login-help">
              Introduce tu correo y te enviaremos un enlace para crear una contraseña nueva.
            </p>

            <div className="login-field">
              <label htmlFor="recover-email">Correo electrónico</label>
              <input
                id="recover-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                placeholder="admin@amivera.es"
                required
                autoComplete="email"
                disabled={submitting}
              />
            </div>

            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-success">{info}</p>}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>

            <button
              type="button"
              className="login-link"
              onClick={() => switchMode('login')}
              disabled={submitting}
            >
              ← Volver a iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
