import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

type Mode = 'login' | 'recover' | 'change';

export default function Login() {
  const navigate = useNavigate();
  const { login, requestPasswordReset, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const errorMsg = await login(email, password);
    if (errorMsg) { setError(errorMsg); setSubmitting(false); return; }
    navigate('/admin/dashboard', { replace: true });
  }

  async function handleRecover(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const errorMsg = await requestPasswordReset(email);
    setSubmitting(false);
    if (errorMsg) { setError(errorMsg); return; }
    setInfo(
      'Si existe una cuenta con ese correo, te hemos enviado un enlace para crear una ' +
      'contraseña nueva. Revisa tu bandeja de entrada (y la carpeta de spam).',
    );
  }

  // Cambiar contraseña: reautentica con la actual y fija la nueva.
  async function handleChangePwd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (newPassword.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setError('Las contraseñas nuevas no coinciden.'); return; }

    setSubmitting(true);
    const loginErr = await login(email, password);
    if (loginErr) { setSubmitting(false); setError('Correo o contraseña actual incorrectos.'); return; }
    const updErr = await updatePassword(newPassword);
    setSubmitting(false);
    if (updErr) { setError(updErr); return; }
    navigate('/admin/dashboard', { replace: true });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
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

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email" type="email" value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                placeholder="admin@amivera.es" required autoComplete="email" disabled={submitting}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password" type="password" value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                placeholder="••••••••" required autoComplete="current-password" disabled={submitting}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>

            <button type="button" className="login-link" onClick={() => switchMode('recover')} disabled={submitting}>
              ¿Has olvidado tu contraseña?
            </button>
            <button type="button" className="login-link" onClick={() => switchMode('change')} disabled={submitting}>
              Cambiar la contraseña
            </button>
          </form>
        )}

        {mode === 'recover' && (
          <form onSubmit={handleRecover} className="login-form">
            <p className="login-help">
              Introduce tu correo y te enviaremos un enlace para crear una contraseña nueva.
            </p>

            <div className="login-field">
              <label htmlFor="recover-email">Correo electrónico</label>
              <input
                id="recover-email" type="email" value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                placeholder="admin@amivera.es" required autoComplete="email" disabled={submitting}
              />
            </div>

            {error && <p className="login-error">{error}</p>}
            {info && <p className="login-success">{info}</p>}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>

            <button type="button" className="login-link" onClick={() => switchMode('login')} disabled={submitting}>
              ← Volver a iniciar sesión
            </button>
          </form>
        )}

        {mode === 'change' && (
          <form onSubmit={handleChangePwd} className="login-form">
            <p className="login-help">
              Escribe tu correo, la contraseña actual y la nueva. Al cambiarla entrarás directamente.
            </p>

            <div className="login-field">
              <label htmlFor="change-email">Correo electrónico</label>
              <input
                id="change-email" type="email" value={email}
                onChange={e => setEmail(e.currentTarget.value)}
                placeholder="admin@amivera.es" required autoComplete="email" disabled={submitting}
              />
            </div>

            <div className="login-field">
              <label htmlFor="change-current">Contraseña actual</label>
              <input
                id="change-current" type="password" value={password}
                onChange={e => setPassword(e.currentTarget.value)}
                placeholder="••••••••" required autoComplete="current-password" disabled={submitting}
              />
            </div>

            <div className="login-field">
              <label htmlFor="change-new">Nueva contraseña</label>
              <input
                id="change-new" type="password" value={newPassword}
                onChange={e => setNewPassword(e.currentTarget.value)}
                placeholder="••••••••" required minLength={6} autoComplete="new-password" disabled={submitting}
              />
            </div>

            <div className="login-field">
              <label htmlFor="change-confirm">Repite la nueva contraseña</label>
              <input
                id="change-confirm" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.currentTarget.value)}
                placeholder="••••••••" required minLength={6} autoComplete="new-password" disabled={submitting}
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Cambiando…' : 'Cambiar contraseña'}
            </button>

            <button type="button" className="login-link" onClick={() => switchMode('login')} disabled={submitting}>
              ← Volver a iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
