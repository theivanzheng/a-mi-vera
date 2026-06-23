import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useHomeContent } from '../hooks/useHomeContent';
import { PageContentProvider } from '../context/PageContent';
import HomeView from '../components/HomeView';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';

const PublicStore = () => {
  const { products, categories, loading, error } = useProducts();
  const { content, hasStored } = useHomeContent();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q') ?? '';
  const categoria = searchParams.get('categoria') ?? '';

  // ── Gestión de scroll por URL ────────────────────────────────────────────
  // Cada vista (inicio, ?q=, ?categoria=) recuerda su propia posición.
  // Al volver, se restaura; al entrar en una vista nueva, se va arriba.
  // Instantáneo (useLayoutEffect, antes de pintar) → sin saltos visibles.
  const locKey = 'scroll:' + location.pathname + location.search;
  // Flag para ignorar los eventos de scroll que provoca nuestra propia
  // restauración (si no, el listener antiguo guardaría 0 y machacaría la
  // posición de la vista anterior).
  const restoringRef = useRef(false);

  // La restauración la controlamos nosotros, no el navegador.
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
    if (loading) return;
    restoringRef.current = true;
    const saved = sessionStorage.getItem(locKey);
    window.scrollTo(0, saved ? parseInt(saved, 10) : 0);
    // Libera el flag tras el ciclo en que se disparan los eventos de scroll.
    requestAnimationFrame(() => { restoringRef.current = false; });
  }, [locKey, loading]);

  // Guarda la posición SOLO durante el scroll real del usuario.
  useEffect(() => {
    const save = () => {
      if (!restoringRef.current) sessionStorage.setItem(locKey, String(window.scrollY));
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [locKey]);

  // Sección Novedades: fijados manualmente vigentes + los 10 más recientes.
  // Capturamos la hora una vez (inicializador de estado → no impuro en render).
  const [now] = useState(() => Date.now());
  const isPinnedNovedad = (p: typeof products[number]) =>
    p.novedadFija === true ||
    (p.novedadHasta != null && new Date(p.novedadHasta).getTime() > now);

  const novedades = (() => {
    const pinned = products.filter(isPinnedNovedad);
    const recent = [...products]
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 10);
    const seen = new Set<string>();
    return [...pinned, ...recent].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  })();

  const itemsForCategory = (cat: string) =>
    cat === 'Novedades' ? novedades : products.filter(p => (p.categories ?? []).includes(cat));

  const categorizedProducts = categories
    .map(cat => ({ category: cat, items: itemsForCategory(cat) }))
    .filter(group => group.items.length > 0);

  const searchResults = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function goToCategory(cat: string) {
    navigate(`/?categoria=${encodeURIComponent(cat)}`);
  }

  // ── Vista 1: resultados de búsqueda ──────────────────────────────────────
  let catalogContent;
  if (searchQuery) {
    catalogContent = (
      <main className="main-content platsupply-layout" style={{ paddingTop: '100px', minHeight: '80vh' }}>
        <h2>Resultados para: &quot;{searchQuery}&quot;</h2>
        <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
          Se encontraron {searchResults.length} artículos.
        </p>
        {searchResults.length > 0 ? (
          <div className="search-results-grid">
            {searchResults.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products">No hay productos que coincidan con tu búsqueda.</div>
        )}
      </main>
    );
  // ── Vista 2: categoría completa ("Ver todos") ────────────────────────────
  } else if (categoria) {
    const items = itemsForCategory(categoria);
    catalogContent = (
      <main className="main-content platsupply-layout" style={{ paddingTop: '100px', minHeight: '80vh' }}>
        <div className="category-view-header">
          <Link to="/" className="category-back-link">← Volver al inicio</Link>
          <h2>{categoria}</h2>
          <p className="category-view-count">{items.length} artículo{items.length === 1 ? '' : 's'}</p>
        </div>
        {loading ? (
          <p className="store-loading-text">Cargando…</p>
        ) : items.length > 0 ? (
          <div className="search-results-grid">
            {items.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="no-products">No hay productos en esta categoría.</div>
        )}
      </main>
    );
  // ── Vista 3: portada boutique ────────────────────────────────────────────
  } else {
    catalogContent = (
      <PageContentProvider value={{ content, editing: false, hasStored, setField: () => {} }}>
        <HomeView />
      </PageContentProvider>
    );
  }

  return (
    <div className="store-container">
      <Navbar />
      {catalogContent}
    </div>
  );
};

export default PublicStore;
