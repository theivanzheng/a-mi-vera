import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Archive, Home } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Inicio'     },
  { to: '/admin/productos',  icon: Package,         label: 'Productos'  },
  { to: '/admin/categorias', icon: Tag,             label: 'Categorías' },
  { to: '/admin/stock',      icon: Archive,         label: 'Stock'      },
  { to: '/admin/portada',    icon: Home,            label: 'Portada'    },
] as const;

export default function AdminBottomNav() {
  return (
    <nav className="admin-bottom-nav" aria-label="Navegación principal">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ? 'admin-nav-item admin-nav-item--active' : 'admin-nav-item'
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
