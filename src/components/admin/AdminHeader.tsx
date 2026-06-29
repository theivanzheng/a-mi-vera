import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_TITLES: Record<string, string> = {
  '/admin/dashboard':  'Panel de control',
  '/admin/productos':  'Productos',
  '/admin/productos/nuevo': 'Nuevo producto',
  '/admin/categorias': 'Categorías',
};

function getTitle(pathname: string): string {
  if (pathname.endsWith('/editar')) return 'Editar producto';
  return ROUTE_TITLES[pathname] ?? 'Administración';
}

export default function AdminHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="admin-topbar">
      <span className="admin-topbar-title">{getTitle(pathname)}</span>
      <button
        className="admin-topbar-logout"
        onClick={handleLogout}
        aria-label="Cerrar sesión"
      >
        <LogOut size={16} />
        <span>Salir</span>
      </button>
    </header>
  );
}
