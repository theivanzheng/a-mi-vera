import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import Navbar from '../components/Navbar';

interface CatProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  description?: string;
  images?: string[];
  categories?: string[];
  destacado?: boolean;
}

interface Group {
  key: string;
  id: string;      // ancla URL-safe para deep-linking (#destacados, #regalos-con-foto…)
  label: string;
  items: CatProduct[];
}

// Convierte un texto en un id seguro para usar como ancla en la URL.
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const Catalogo = () => {
  const { products, categories, loading } = useProducts();
  const location = useLocation();

  // ── Construir las secciones del catálogo ──
  // 1º "Destacados" (productos marcados como destacado), luego cada categoría.
  const groups: Group[] = [];

  // Mismo criterio que la portada: productos marcados como destacado y, si no
  // hay ninguno, los 5 primeros como fallback. Así la sección "Destacados"
  // siempre existe y coincide con la fila de la home.
  const flagged = (products as CatProduct[]).filter(p => p.destacado);
  const featured = flagged.length > 0 ? flagged : (products as CatProduct[]).slice(0, 5);
  if (featured.length > 0) {
    groups.push({ key: '__destacados__', id: 'destacados', label: 'Destacados', items: featured });
  }

  categories.forEach(cat => {
    const items = (products as CatProduct[]).filter(p => (p.categories ?? []).includes(cat));
    if (items.length > 0) groups.push({ key: cat, id: slugify(cat), label: cat, items });
  });

  const uncategorized = (products as CatProduct[]).filter(p => !p.categories || p.categories.length === 0);
  if (uncategorized.length > 0) {
    groups.push({ key: '__otros__', id: 'otros', label: 'Otros', items: uncategorized });
  }

  // ── Búsqueda de producto ──
  const [query, setQuery] = useState('');
  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;
  const results = isSearching
    ? (products as CatProduct[]).filter(p =>
        p.title.toLowerCase().includes(trimmed) ||
        (p.description ?? '').toLowerCase().includes(trimmed)
      )
    : [];

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [canFadeLeft, setCanFadeLeft] = useState(false);
  const [canFadeRight, setCanFadeRight] = useState(false);

  const filtersWrapRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Distancia desde el top del viewport hasta el borde inferior de la barra
  // sticky (navbar + pestañas). Sirve de línea de referencia para el spy.
  const getStickyOffset = () =>
    filtersWrapRef.current?.getBoundingClientRect().bottom ?? 0;

  const scrollToKey = useCallback((key: string, behavior: ScrollBehavior) => {
    const sec = sectionRefs.current.get(key);
    if (!sec) return;
    const offset = getStickyOffset();
    const top = sec.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior });
  }, []);

  // ── Fade de bordes: visible según haya scroll horizontal a cada lado ──
  const updateFades = useCallback(() => {
    const el = filtersWrapRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanFadeLeft(el.scrollLeft > 2);
    setCanFadeRight(el.scrollLeft < maxScroll - 2);
  }, []);

  // ── Deep-link: al cargar, si la URL trae #ancla, salta a esa sección ──
  useEffect(() => {
    if (loading) return;
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const g = groups.find(gr => gr.id === hash);
    if (!g) return;
    // Esperar a que las secciones estén montadas y medidas.
    requestAnimationFrame(() => scrollToKey(g.key, 'auto'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, location.hash, groups.map(g => g.id).join('|')]);

  // ── Scroll-spy: resalta la categoría cuya sección cruza la línea sticky ──
  useEffect(() => {
    if (groups.length === 0) return;

    const onScroll = () => {
      const offset = getStickyOffset();
      let current = groups[0]?.key ?? null;
      for (const g of groups) {
        const sec = sectionRefs.current.get(g.key);
        if (!sec) continue;
        if (sec.getBoundingClientRect().top - offset <= 4) {
          current = g.key;
        }
      }
      setActiveKey(prev => (prev === current ? prev : current));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.map(g => g.key).join('|')]);

  // ── Mantener la pestaña activa centrada dentro de la barra horizontal ──
  useEffect(() => {
    if (!activeKey) return;
    const tab = tabRefs.current.get(activeKey);
    const wrap = filtersWrapRef.current;
    if (!tab || !wrap) return;
    const target = tab.offsetLeft - wrap.clientWidth / 2 + tab.clientWidth / 2;
    wrap.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeKey]);

  // ── Recalcular fades al cargar productos / redimensionar ──
  useEffect(() => {
    updateFades();
    window.addEventListener('resize', updateFades);
    return () => window.removeEventListener('resize', updateFades);
  }, [updateFades, loading, groups.length]);

  const handleTabClick = (key: string) => scrollToKey(key, 'smooth');

  return (
    <div className="store-container">
      <Navbar />

      <div className="cat-page">
        {/* Page header */}
        <header className="cat-header">
          <h1 className="cat-page-title">Catálogo</h1>
          <p className="cat-page-sub">Todos nuestros regalos personalizados</p>

          {/* Buscador de producto */}
          <div className="cat-search">
            <Search size={18} strokeWidth={1.5} className="cat-search-icon" />
            <input
              type="text"
              className="cat-search-input"
              placeholder="Buscar un producto…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {isSearching && (
              <button
                type="button"
                className="cat-search-clear"
                aria-label="Borrar búsqueda"
                onClick={() => setQuery('')}
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </header>

        {/* Sticky category tabs — navegación + scroll-spy (ocultos al buscar) */}
        {!isSearching && (
          <div
            className={`cat-filters-outer${canFadeLeft ? ' fade-left' : ''}${canFadeRight ? ' fade-right' : ''}`}
          >
            <div
              className="cat-filters-wrap"
              ref={filtersWrapRef}
              onScroll={updateFades}
            >
              <div className="cat-filters">
                {groups.map(g => (
                  <button
                    key={g.key}
                    ref={el => { if (el) tabRefs.current.set(g.key, el); }}
                    className={`cat-filter-tab${activeKey === g.key ? ' active' : ''}`}
                    onClick={() => handleTabClick(g.key)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="cat-main">
          {loading ? (
            <p className="cat-loading">Cargando productos…</p>
          ) : isSearching ? (
            // ── Resultados de búsqueda ──
            results.length > 0 ? (
              <section className="cat-group">
                <h2 className="cat-group-title">
                  {results.length} RESULTADO{results.length === 1 ? '' : 'S'}
                </h2>
                <div className="cat-grid">
                  {results.map(p => (
                    <CatProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ) : (
              <p className="cat-empty">No encontramos productos para «{query.trim()}».</p>
            )
          ) : groups.length === 0 ? (
            <p className="cat-empty">No hay productos disponibles.</p>
          ) : (
            groups.map(g => (
              <section
                key={g.key}
                id={g.id}
                className="cat-group"
                ref={el => { if (el) sectionRefs.current.set(g.key, el); }}
              >
                <h2 className="cat-group-title">{g.label.toUpperCase()}</h2>
                <div className="cat-grid">
                  {g.items.map(p => (
                    <CatProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
};

const CatProductCard = ({ product }: { product: CatProduct }) => (
  <Link to={`/producto/${product.slug}`} className="cat-card">
    <div className="cat-card-img">
      {product.images?.[0] ? (
        <img src={product.images[0]} alt={product.title} loading="lazy" />
      ) : (
        <div className="cat-card-placeholder" />
      )}
    </div>
    <div className="cat-card-info">
      <span className="cat-card-name">{product.title}</span>
      <span className="cat-card-price">{product.price} €</span>
    </div>
  </Link>
);

export default Catalogo;
