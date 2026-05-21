import { useNavigate } from 'react-router-dom';
import { Package, Tag, Plus, Eye } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';

export default function Dashboard() {
  const { products, loading: productsLoading, error: productsError } = useAdminProducts();
  const { categories, loading: categoriesLoading, error: categoriesError } = useAdminCategories();
  const navigate = useNavigate();
  const loading = productsLoading || categoriesLoading;
  const error = productsError ?? categoriesError;

  const stats = [
    { label: 'Productos',   value: products.length,   icon: Package },
    { label: 'Categorías',  value: categories.length,  icon: Tag     },
  ];

  return (
    <div className="admin-dashboard">
      {loading && (
        <p className="admin-loading-text">Cargando resumen del panel…</p>
      )}

      {!loading && error && (
        <p className="admin-form-error">{error}</p>
      )}

      <div className="admin-stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="admin-stat-card">
            <div className="admin-stat-icon">
              <Icon size={22} />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-value">{loading ? '…' : value}</span>
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
