import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';

export default function ProductList() {
  const { products, deleteProduct, loading, saving, storageWarning } = useAdminProducts();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteConfirm(id: string) {
    setDeleteError(null);
    const err = await deleteProduct(id);
    if (err) {
      setDeleteError(err);
    } else {
      setPendingDelete(null);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="admin-list-header">
          <h1>Productos</h1>
        </div>
        <p className="admin-loading-text">Cargando productos…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <div className="admin-list-header">
          <h1>Productos</h1>
          <Link to="/admin/productos/nuevo" className="admin-add-btn">
            <Plus size={16} />
            Añadir
          </Link>
        </div>
        <div className="admin-empty">
          <div className="admin-empty-icon"><Package size={40} /></div>
          <p>No hay productos todavía.</p>
          <Link to="/admin/productos/nuevo" className="admin-add-btn">
            <Plus size={16} />
            Añadir el primero
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-list-header">
        <h1>Productos</h1>
        <Link to="/admin/productos/nuevo" className="admin-add-btn">
          <Plus size={16} />
          Añadir
        </Link>
      </div>

      {storageWarning && (
        <div className="admin-storage-warning">{storageWarning}</div>
      )}

      <div className="admin-product-cards">
        {products.map(product => (
          <div
            key={product.id}
            className={
              pendingDelete === product.id
                ? 'admin-product-card admin-product-card--confirm'
                : 'admin-product-card'
            }
          >
            <img
              className="admin-product-thumb"
              src={product.images[0] ?? 'https://via.placeholder.com/60?text=?'}
              alt={product.title}
            />

            {pendingDelete === product.id ? (
              <div className="admin-delete-confirm">
                {deleteError && pendingDelete === product.id
                  ? <span className="admin-delete-error">{deleteError}</span>
                  : <span className="admin-delete-question">¿Eliminar "{product.title}"?</span>
                }
                <button
                  className="admin-delete-no"
                  onClick={() => { setPendingDelete(null); setDeleteError(null); }}
                  disabled={saving}
                >
                  No
                </button>
                <button
                  className="admin-delete-yes"
                  onClick={() => handleDeleteConfirm(product.id)}
                  disabled={saving}
                >
                  {saving ? '…' : 'Sí'}
                </button>
              </div>
            ) : (
              <div className="admin-product-info">
                <div className="admin-product-name">{product.title}</div>
                <div className="admin-product-meta">{product.category}</div>
                <div className="admin-product-foot">
                  <span className="admin-product-price">
                    {product.price.toFixed(2)} €
                  </span>
                  <div className="admin-product-actions">
                    <button
                      className="admin-icon-btn"
                      onClick={() => navigate(`/admin/productos/${product.id}/editar`)}
                      aria-label={`Editar ${product.title}`}
                      disabled={saving}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="admin-icon-btn admin-icon-btn--danger"
                      onClick={() => setPendingDelete(product.id)}
                      aria-label={`Eliminar ${product.title}`}
                      disabled={saving}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
