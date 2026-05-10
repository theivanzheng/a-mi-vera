import { useNavigate } from 'react-router-dom';
import { Package, Tag, Plus, Eye } from 'lucide-react';
import { useProductContext } from '../../context/ProductContext';

export default function Dashboard() {
  const { products, categories } = useProductContext();
  const navigate = useNavigate();

  const stats = [
    { label: 'Productos',   value: products.length,   icon: Package },
    { label: 'Categorías',  value: categories.length,  icon: Tag     },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <div className="admin-stat-icon">
              <Icon size={22} />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{value}</span>
              <span className="admin-stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-quick-actions">
        <h2>Acciones rápidas</h2>
        <div className="admin-action-buttons">
          <button
            className="admin-action-btn admin-action-btn--primary"
            onClick={() => navigate('/admin/productos/nuevo')}
          >
            <Plus size={18} />
            Añadir producto
          </button>
          <button
            className="admin-action-btn"
            onClick={() => navigate('/admin/productos')}
          >
            <Eye size={18} />
            Ver productos
          </button>
        </div>
      </div>
    </div>
  );
}
