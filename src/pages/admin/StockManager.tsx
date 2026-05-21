import { useState, useMemo, useRef, useCallback } from 'react';
import { Search, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { isSupabaseConfigured } from '../../lib/supabase';

type SaveStatus = 'saving' | 'saved';

export default function StockManager() {
  const { products, loading, patchProduct } = useAdminProducts();

  const [search, setSearch]             = useState('');
  const [filterNoStock, setFilterNoStock] = useState(false);
  const [drafts, setDrafts]             = useState<Record<string, number>>({});
  const [saveStatus, setSaveStatus]     = useState<Record<string, SaveStatus>>({});
  const [errorId, setErrorId]           = useState<Record<string, string>>({});

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const patchRef  = useRef(patchProduct);
  patchRef.current = patchProduct;

  // ── Filtrado ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (q && !p.title.toLowerCase().includes(q)) return false;
      if (filterNoStock && (p.stock ?? 0) > 0) return false;
      return true;
    });
  }, [products, search, filterNoStock]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function getDraft(id: string, original: number): number {
    return drafts[id] ?? original;
  }

  const scheduleSave = useCallback((id: string, value: number) => {
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    setErrorId(prev => { const n = { ...prev }; delete n[id]; return n; });

    timersRef.current[id] = setTimeout(async () => {
      delete timersRef.current[id];
      setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));

      const err = await patchRef.current(id, { stock: value });

      if (err) {
        setSaveStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
        setErrorId(prev => ({ ...prev, [id]: err }));
      } else {
        setDrafts(prev => { const n = { ...prev }; delete n[id]; return n; });
        setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => {
            if (prev[id] === 'saved') { const n = { ...prev }; delete n[id]; return n; }
            return prev;
          });
        }, 2000);
      }
    }, 650);
  }, []);

  function changeStock(id: string, newValue: number) {
    const safe = Math.max(0, newValue);
    setDrafts(prev => ({ ...prev, [id]: safe }));
    scheduleSave(id, safe);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isSupabaseConfigured) {
    return (
      <div>
        <div className="admin-list-header"><h1>Stock</h1></div>
        <div className="admin-placeholder">
          <div className="admin-placeholder-icon"><AlertCircle size={40} /></div>
          <h2>Supabase no está configurado</h2>
          <p>La gestión de stock requiere conexión a Supabase. Configura las variables de entorno en <code>.env.local</code>.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="admin-list-header"><h1>Stock</h1></div>
        <p className="admin-loading-text">Cargando productos…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        <div className="admin-list-header"><h1>Stock</h1></div>
        <p className="admin-loading-text">No hay productos.</p>
      </div>
    );
  }

  const sinStockCount = products.filter(p => (p.stock ?? 0) === 0).length;

  return (
    <div>
      <div className="admin-list-header">
        <h1>Stock</h1>
        {sinStockCount > 0 && (
          <span className="admin-badge admin-badge--no-stock" style={{ alignSelf: 'center' }}>
            {sinStockCount} sin stock
          </span>
        )}
      </div>

      {/* ── Búsqueda + filtro ── */}
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
          <button
            className={`admin-chip${filterNoStock ? ' admin-chip--active' : ''}`}
            onClick={() => setFilterNoStock(v => !v)}
          >
            Solo sin stock
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="admin-no-results">
          <strong>Sin resultados</strong>
          <span>Ningún producto coincide con la búsqueda.</span>
        </div>
      )}

      {/* ── Lista de stock ── */}
      <div className="admin-stock-list">
        {filtered.map(product => {
          const original = product.stock ?? 0;
          const draft    = getDraft(product.id, original);
          const dirty    = drafts[product.id] !== undefined;
          const status   = saveStatus[product.id];
          const errMsg   = errorId[product.id];

          return (
            <div key={product.id} className="admin-stock-item">
              <img
                className="admin-stock-thumb"
                src={product.images[0] ?? 'https://via.placeholder.com/44?text=?'}
                alt={product.title}
              />

              <div className="admin-stock-info">
                <div className="admin-stock-name">{product.title}</div>
                <div className="admin-stock-cat">{product.category}</div>
                {errMsg && <div className="admin-form-error" style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>{errMsg}</div>}
              </div>

              <div className="admin-stock-controls">
                <button
                  className="admin-stock-btn"
                  onClick={() => changeStock(product.id, draft - 1)}
                  disabled={draft <= 0}
                  aria-label="Decrementar stock"
                >
                  −
                </button>

                <input
                  className={`admin-stock-input${dirty ? ' admin-stock-input--dirty' : ''}`}
                  type="number"
                  min={0}
                  value={draft}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) changeStock(product.id, v);
                  }}
                  aria-label={`Stock de ${product.title}`}
                />

                <button
                  className="admin-stock-btn"
                  onClick={() => changeStock(product.id, draft + 1)}
                  aria-label="Incrementar stock"
                >
                  +
                </button>

                <div className="admin-stock-status">
                  {status === 'saving' && (
                    <span className="admin-stock-saving" aria-label="Guardando">
                      <Loader2 size={14} />
                    </span>
                  )}
                  {status === 'saved' && (
                    <span className="admin-stock-saved" aria-label="Guardado">
                      <Check size={14} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
