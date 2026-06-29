import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Package, Search, Eye, EyeOff, X, Star, Sparkles, ArrowUpDown, Tag, CheckSquare } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';

type VisibilityFilter = 'all' | 'visible' | 'hidden';
type SortBy          = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'alpha';

export default function ProductList() {
  const { products, loading, saving, deleteProduct, patchProduct, bulkPatch, bulkSetCategory, bulkDelete, storageWarning } = useAdminProducts();
  const { categoryNames } = useAdminCategories();
  const navigate = useNavigate();

  // Filtros
  const [search, setSearch]               = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterVisible, setFilterVisible]   = useState<VisibilityFilter>('all');
  const [filterDestacado, setFilterDestacado] = useState(false);
  const [filterNuevo, setFilterNuevo]       = useState(false);
  const [sortBy, setSortBy]                 = useState<SortBy>('newest');

  // Confirmación de borrado individual
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError]     = useState<string | null>(null);

  // Edición masiva
  const [selectMode, setSelectMode]         = useState(false);
  const [selected, setSelected]             = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy]             = useState(false);
  const [bulkError, setBulkError]           = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

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
  }, [products, search, filterCategory, filterVisible, filterDestacado, filterNuevo, sortBy]);

  const hasActiveFilters =
    search !== '' || filterCategory !== '' || filterVisible !== 'all' ||
    filterDestacado || filterNuevo;

  function clearFilters() {
    setSearch('');
    setFilterCategory('');
    setFilterVisible('all');
    setFilterDestacado(false);
    setFilterNuevo(false);
  }

  // ── Handlers individuales ───────────────────────────────────────────────────

  async function handleDeleteConfirm(id: string) {
    setDeleteError(null);
    const err = await deleteProduct(id);
    if (err) setDeleteError(err);
    else setPendingDelete(null);
  }

  async function handleToggleVisible(id: string, current: boolean | undefined) {
    await patchProduct(id, { visible: !(current ?? true) });
  }

  // ── Selección / edición masiva ──────────────────────────────────────────────

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() { setSelected(new Set(filtered.map(p => p.id))); }
  function clearSelection() { setSelected(new Set()); }
  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setBulkDeleteConfirm(false);
    setBulkError(null);
  }

  async function runBulk(fn: () => Promise<string | null>, clearAfter = false) {
    setBulkBusy(true);
    setBulkError(null);
    const err = await fn();
    setBulkBusy(false);
    if (err) { setBulkError(err); return; }
    if (clearAfter) { setSelected(new Set()); setBulkDeleteConfirm(false); }
  }
  const selectedIds = () => [...selected];
  function handleBulkCategory(name: string) { if (name) runBulk(() => bulkSetCategory(selectedIds(), name)); }
  function handleBulkPatch(patch: Parameters<typeof bulkPatch>[1]) { runBulk(() => bulkPatch(selectedIds(), patch)); }
  function handleBulkDelete() { runBulk(() => bulkDelete(selectedIds()), true); }

  // ── Estados de carga / vacío ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div>
        <div className="admin-list-header"><h1>Productos</h1></div>
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
        <div className="admin-list-header-actions">
          <button
            type="button"
            className="admin-add-btn admin-add-btn--ghost"
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          >
            {selectMode ? <><X size={16} /> Cancelar</> : <><CheckSquare size={16} /> Seleccionar</>}
          </button>
          {!selectMode && (
            <Link to="/admin/productos/nuevo" className="admin-add-btn">
              <Plus size={16} /> Añadir
            </Link>
          )}
        </div>
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

          {/* Limpiar */}
          {hasActiveFilters && (
            <button className="admin-chip admin-chip--clear" onClick={clearFilters} aria-label="Limpiar filtros">
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Barra de acciones masivas ── */}
      {selectMode && (
        <div className="admin-bulk-bar">
          <div className="admin-bulk-bar-head">
            <span className="admin-bulk-bar-count">
              {selected.size} seleccionado{selected.size === 1 ? '' : 's'}
            </span>
            <button type="button" className="admin-chip" onClick={selectAllFiltered}>
              Seleccionar todos ({filtered.length})
            </button>
            {selected.size > 0 && (
              <button type="button" className="admin-chip" onClick={clearSelection}>Ninguno</button>
            )}
          </div>

          {selected.size === 0 ? (
            <p className="admin-bulk-hint">Marca productos para editarlos en bloque.</p>
          ) : bulkDeleteConfirm ? (
            <div className="admin-bulk-actions">
              <span className="admin-delete-question">
                ¿Eliminar {selected.size} producto{selected.size === 1 ? '' : 's'}? No se puede deshacer.
              </span>
              <button className="admin-delete-no" disabled={bulkBusy} onClick={() => setBulkDeleteConfirm(false)}>No</button>
              <button className="admin-delete-yes" disabled={bulkBusy} onClick={handleBulkDelete}>
                {bulkBusy ? '…' : 'Sí, eliminar'}
              </button>
            </div>
          ) : (
            <div className="admin-bulk-actions">
              <select
                className="admin-chip admin-chip--select"
                value=""
                disabled={bulkBusy}
                onChange={e => handleBulkCategory(e.target.value)}
                aria-label="Cambiar categoría de los seleccionados"
              >
                <option value="">Cambiar categoría…</option>
                {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <span className="admin-bulk-sep" aria-hidden="true" />

              <button className="admin-chip" disabled={bulkBusy} onClick={() => handleBulkPatch({ visible: true })}>
                <Eye size={12} /> Mostrar
              </button>
              <button className="admin-chip" disabled={bulkBusy} onClick={() => handleBulkPatch({ visible: false })}>
                <EyeOff size={12} /> Ocultar
              </button>

              <button className="admin-chip" disabled={bulkBusy} onClick={() => handleBulkPatch({ destacado: true })}>
                <Star size={12} /> Destacar
              </button>
              <button className="admin-chip" disabled={bulkBusy} onClick={() => handleBulkPatch({ destacado: false })}>
                Quitar destacado
              </button>

              <button className="admin-chip" disabled={bulkBusy} onClick={() => handleBulkPatch({ nuevo: true })}>
                <Sparkles size={12} /> Nuevo
              </button>
              <button className="admin-chip" disabled={bulkBusy} onClick={() => handleBulkPatch({ nuevo: false })}>
                Quitar nuevo
              </button>

              <span className="admin-bulk-sep" aria-hidden="true" />

              <button className="admin-chip admin-chip--danger" disabled={bulkBusy} onClick={() => setBulkDeleteConfirm(true)}>
                <Trash2 size={12} /> Eliminar
              </button>

              {bulkBusy && <span className="admin-bulk-busy">Guardando…</span>}
            </div>
          )}

          {bulkError && <p className="admin-form-error" style={{ margin: '0.5rem 0 0' }}>{bulkError}</p>}
        </div>
      )}

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
        {filtered.map(product => {
          // ── Modo selección: tarjeta marcable ──
          if (selectMode) {
            const isSelected = selected.has(product.id);
            return (
              <div
                key={product.id}
                className={`admin-product-card admin-product-card--selectable${isSelected ? ' admin-product-card--selected' : ''}`}
                onClick={() => toggleSelect(product.id)}
                role="button"
                aria-pressed={isSelected}
              >
                <input
                  type="checkbox"
                  className="admin-product-check"
                  checked={isSelected}
                  readOnly
                  tabIndex={-1}
                  aria-label={`Seleccionar ${product.title}`}
                />
                <img
                  className="admin-product-thumb"
                  src={product.images[0] ?? 'https://via.placeholder.com/60?text=?'}
                  alt={product.title}
                />
                <div className="admin-product-info">
                  <div className="admin-product-name">{product.title}</div>
                  <div className="admin-product-meta">{product.category}</div>
                  {(product.visible === false || product.destacado || product.nuevo) && (
                    <div className="admin-product-badges">
                      {product.visible === false && <span className="admin-badge admin-badge--hidden">Oculto</span>}
                      {product.destacado && <span className="admin-badge admin-badge--destacado">Destacado</span>}
                      {product.nuevo && <span className="admin-badge admin-badge--nuevo">Nuevo</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // ── Modo normal ──
          return (
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

                  {(product.visible === false || product.destacado || product.nuevo) && (
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
                    </div>
                  )}

                  <div className="admin-product-foot">
                    <span className="admin-product-price">{product.price.toFixed(2)} €</span>
                    <div className="admin-product-actions">
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
          );
        })}
      </div>

      {hasActiveFilters && filtered.length > 0 && !selectMode && (
        <p className="admin-filter-summary">
          Mostrando {filtered.length} de {products.length} productos
        </p>
      )}
    </div>
  );
}
