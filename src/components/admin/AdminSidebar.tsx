import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Panel de control' },
  { to: '/admin/productos',  icon: Package,         label: 'Productos'        },
  { to: '/admin/categorias', icon: Tag,             label: 'Categorías'       },
  { to: '/admin/paginas',    icon: FileText,        label: 'Páginas'          },
] as const;

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="admin-sidebar" aria-label="Navegación del panel">
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-name">A Mi Vera</span>
        <span className="admin-sidebar-brand-sub">Panel de administración</span>
      </div>

      <nav className="admin-sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'admin-sidebar-link admin-sidebar-link--active'
                : 'admin-sidebar-link'
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="admin-sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
