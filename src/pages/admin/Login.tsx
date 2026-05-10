import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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

        <form onSubmit={handleSubmit} className="login-form">
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
        </form>
      </div>
    </div>
  );
}
