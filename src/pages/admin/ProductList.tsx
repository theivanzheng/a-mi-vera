import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package, Search, Eye, EyeOff, X, Info, Star, Sparkles, PackageX, ArrowUpDown, Tag } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';

type VisibilityFilter = 'all' | 'visible' | 'hidden';
type StockFilter     = 'all' | 'in-stock' | 'no-stock';
type SortBy          = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'alpha';

export default function ProductList() {
  const { products, loading, saving, deleteProduct, patchProduct, storageWarning } = useAdminProducts();
  const { categoryNames } = useAdminCategories();
  const navigate = useNavigate();

  // Filtros
  const [search, setSearch]               = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVisible, setFilterVisible]   = useState<VisibilityFilter>('all');
  const [filterDestacado, setFilterDestacado] = useState(false);
  const [filterNuevo, setFilterNuevo]       = useState(false);
  const [filterStock, setFilterStock]       = useState<StockFilter>('all');
  const [sortBy, setSortBy]                 = useState<SortBy>('newest');

  // Confirmación de borrado
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // ── Filtrado ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(p => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterVisible === 'visible' && p.visible === false) return false;
      if (filterVisible === 'hidden' && p.visible !== false) return false;
      if (filterDestacado && !p.destacado) return false;
      if (filterNuevo && !p.nuevo) return false;
      const stock = p.stock ?? 0;
      if (filterStock === 'in-stock' && stock <= 0) return false;
      if (filterStock === 'no-stock' && stock > 0) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'newest':     return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
        case 'oldest':     return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
        case 'price-asc':  return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'alpha':      return a.title.localeCompare(b.title, 'es');
      }
    });
  }, [products, search, filterCategory, filterVisible, filterDestacado, filterNuevo, filterStock, sortBy]);

  const hasActiveFilters =
    search !== '' || filterCategory !== '' || filterVisible !== 'all' ||
    filterDestacado || filterNuevo || filterStock !== 'all';

  function clearFilters() {
    setSearch('');
    setFilterCategory('');
    setFilterVisible('all');
    setFilterDestacado(false);
    setFilterNuevo(false);
    setFilterStock('all');
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleDeleteConfirm(id: string) {
    setDeleteError(null);
    const err = await deleteProduct(id);
    if (err) setDeleteError(err);
    else setPendingDelete(null);
  }

  async function handleToggleVisible(id: string, current: boolean | undefined) {
    await patchProduct(id, { visible: !(current ?? true) });
  }

  // ── Estado de carga ────────────────────────────────────────────────────────

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
            <Plus size={16} /> Añadir
          </Link>
        </div>
        <div className="admin-empty">
          <div className="admin-empty-icon"><Package size={40} /></div>
          <p>No hay productos todavía.</p>
          <Link to="/admin/productos/nuevo" className="admin-add-btn">
            <Plus size={16} /> Añadir el primero
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="admin-list-header">
        <h1>Productos</h1>
        <Link to="/admin/productos/nuevo" className="admin-add-btn">
          <Plus size={16} /> Añadir
        </Link>
      </div>

      {storageWarning && (
        <div className="admin-storage-warning">{storageWarning}</div>
      )}

      {/* ── Barra de búsqueda y filtros ── */}
      <div className="admin-toolbar">
        <div className="admin-search-wrap">
          <Search size={15} className="admin-search-icon" />
          <input
            className="admin-search-input"
            type="search"
            placeholder={`Buscar en ${products.length} productos…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-filter-row">
          {/* Ordenar */}
          <div className={`admin-chip-wrap${sortBy !== 'newest' ? ' admin-chip-wrap--active' : ''}`}>
            <ArrowUpDown size={12} className="admin-chip-wrap-icon" aria-hidden="true" />
            <select
              className={`admin-chip admin-chip--select${sortBy !== 'newest' ? ' admin-chip--active' : ''}`}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              aria-label="Ordenar por"
            >
              <option value="newest">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="alpha">Alfabético</option>
            </select>
          </div>

          {/* Categoría */}
          <div className={`admin-chip-wrap${filterCategory ? ' admin-chip-wrap--active' : ''}`}>
            <Tag size={12} className="admin-chip-wrap-icon" aria-hidden="true" />
            <select
              className={`admin-chip admin-chip--select${filterCategory ? ' admin-chip--active' : ''}`}
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              aria-label="Filtrar por categoría"
            >
              <option value="">Categoría</option>
              {categoryNames.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="admin-filter-divider" aria-hidden="true" />

          {/* Visibilidad */}
          <button
            className={`admin-chip${filterVisible === 'visible' ? ' admin-chip--active' : ''}`}
            onClick={() => setFilterVisible(v => v === 'visible' ? 'all' : 'visible')}
          >
            <Eye size={12} /> Visibles
          </button>
          <button
            className={`admin-chip${filterVisible === 'hidden' ? ' admin-chip--active' : ''}`}
            onClick={() => setFilterVisible(v => v === 'hidden' ? 'all' : 'hidden')}
          >
            <EyeOff size={12} /> Ocultos
          </button>

          {/* Destacado */}
          <button
            className={`admin-chip${filterDestacado ? ' admin-chip--active' : ''}`}
            onClick={() => setFilterDestacado(v => !v)}
          >
            <Star size={12} /> Destacado
          </button>

          {/* Nuevo */}
          <button
            className={`admin-chip${filterNuevo ? ' admin-chip--active' : ''}`}
            onClick={() => setFilterNuevo(v => !v)}
          >
            <Sparkles size={12} /> Nuevo
          </button>

          {/* Stock */}
          <button
            className={`admin-chip${filterStock === 'no-stock' ? ' admin-chip--active' : ''}`}
            onClick={() => setFilterStock(v => v === 'no-stock' ? 'all' : 'no-stock')}
          >
            <PackageX size={12} /> Sin stock
          </button>

          {/* Limpiar */}
          {hasActiveFilters && (
            <button className="admin-chip admin-chip--clear" onClick={clearFilters} aria-label="Limpiar filtros">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Sin resultados tras filtro ── */}
      {filtered.length === 0 && (
        <div className="admin-no-results">
          <strong>Sin resultados</strong>
          <span>Ningún producto coincide con los filtros aplicados.</span>
          <button className="admin-chip admin-chip--clear" onClick={clearFilters} style={{ marginTop: '0.75rem' }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Lista ── */}
      <div className="admin-product-cards">
        {filtered.map(product => (
          <div
            key={product.id}
            className={[
              'admin-product-card',
              pendingDelete === product.id ? 'admin-product-card--confirm' : '',
              product.visible === false ? 'admin-product-card--hidden' : '',
            ].filter(Boolean).join(' ')}
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

                {/* Badges de estado */}
                {(product.visible === false || product.destacado || product.nuevo || (product.stock ?? 0) === 0) && (
                  <div className="admin-product-badges">
                    {product.visible === false && (
                      <span className="admin-badge admin-badge--hidden">Oculto</span>
                    )}
                    {product.destacado && (
                      <span className="admin-badge admin-badge--destacado">Destacado</span>
                    )}
                    {product.nuevo && (
                      <span className="admin-badge admin-badge--nuevo">Nuevo</span>
                    )}
                    {(product.stock ?? 0) === 0 && (
                      <span className="admin-badge admin-badge--no-stock">
                        <Info size={8} />
                        Sin stock
                      </span>
                    )}
                  </div>
                )}

                <div className="admin-product-foot">
                  <span className="admin-product-price">{product.price.toFixed(2)} €</span>
                  <div className="admin-product-actions">
                    {/* Toggle visibilidad */}
                    <button
                      className={`admin-icon-btn${product.visible === false ? ' admin-icon-btn--muted' : ''}`}
                      onClick={() => handleToggleVisible(product.id, product.visible)}
                      aria-label={product.visible === false ? 'Mostrar producto' : 'Ocultar producto'}
                      title={product.visible === false ? 'Mostrar en tienda' : 'Ocultar de tienda'}
                      disabled={saving}
                    >
                      {product.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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

      {hasActiveFilters && filtered.length > 0 && (
        <p className="admin-filter-summary">
          Mostrando {filtered.length} de {products.length} productos
        </p>
      )}
    </div>
  );
}
