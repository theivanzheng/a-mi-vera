import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import CardAzul    from '../../IdentidadVisual/Fotosheader/Azul porcelana.png';
import CardBlush   from '../../IdentidadVisual/Fotosheader/Blush.png';
import CardCiruela from '../../IdentidadVisual/Fotosheader/CiruelaSuave.png';
import Hoja        from '../../IdentidadVisual/Rosas/Hoja.png';
import { whatsappLink } from '../lib/whatsapp';

const TICKER_ITEMS = [
  'Hecho a mano', 'Personalizado para ti', 'Envío 24h a toda la península',
  'Pack especial de envío', 'Trato uno a uno', 'Con cariño en cada detalle',
];

const PublicStore = () => {
  const { products, categories, loading, error } = useProducts();
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
    const featuredProducts = products.filter(p => p.destacado).slice(0, 5);
    const displayFeatured = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 5);

    catalogContent = (
      <>
        {/* HERO */}
        <section className="av-hero">
          <div className="av-cards-fan">
            <img src={CardAzul}    className="av-fan-card av-fan-card-1" alt="" aria-hidden="true" />
            <img src={CardBlush}   className="av-fan-card av-fan-card-2" alt="" aria-hidden="true" />
            <img src={CardCiruela} className="av-fan-card av-fan-card-3" alt="" aria-hidden="true" />
          </div>
          <h1 className="av-hero-title">"Cada regalo nace<br />de una conversación."</h1>
          <div className="av-hero-pill-row">
            <div className="av-hero-pill-wrap">
              <img src={Hoja} className="av-hero-hoja" alt="" aria-hidden="true" />
              <span className="av-hero-pill">Regalos personalizados · Hechos a mano</span>
            </div>
          </div>
          <p className="av-hero-sub">
            Grabamos, personalizamos y enviamos con cariño para que tu regalo llegue perfecto.
          </p>
          <Link to="/catalogo" className="av-hero-cta">Descubre el Catálogo →</Link>
        </section>

        {/* TICKER */}
        <div className="av-ticker" aria-hidden="true">
          <div className="av-ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="av-ticker-item">{item}</span>
            ))}
          </div>
        </div>

        {/* PRODUCTOS DESTACADOS */}
        <section id="destacados" className="av-featured">
          <div className="av-featured-header">
            <h2 className="av-featured-title">Productos Destacados</h2>
            <Link to="/catalogo#destacados" className="av-featured-ver">Ver todos →</Link>
          </div>
          <div className="av-featured-scroll">
            {loading ? (
              <p style={{ padding: '0 1rem', color: 'var(--color-text-mid)', fontSize: '0.85rem' }}>Cargando…</p>
            ) : (
              displayFeatured.map(p => (
                <Link key={p.id} to={`/producto/${p.slug}`} className="av-feat-card">
                  <div className="av-feat-img">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" />}
                  </div>
                  <div className="av-feat-name">{p.title}</div>
                  <div className="av-feat-price">{p.price} €</div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* CRISTINA */}
        <section className="av-cristina">
          <p className="av-cristina-eyebrow">¿Nos Conocemos?</p>
          <h2 className="av-cristina-title">Hola! Soy Cristina</h2>
          <div className="av-cristina-video">vídeo próximamente</div>
          <p className="av-cristina-copy">
            Creé A Mi Vera con una sola idea en mente:{' '}
            <em>"que cada regalo cuente una historia"</em>. Cada pieza que sale de mi taller la
            pienso especialmente para la persona que la va a recibir. No es producción en serie,
            no es un regalo más, es algo único, hecho con cariño, que se queda para siempre.
          </p>
          <Link to="/nosotros" className="av-link-cta">Así lo hacemos →</Link>
        </section>

        {/* FRASE OSCURA */}
        <section className="av-dark-quote">
          <p className="av-dark-quote-text">"No vendemos objetos.<br />Creamos recuerdos."</p>
          <span className="av-dark-quote-firma">— Cristina, fundadora de A Mi Vera</span>
        </section>

        {/* WHATSAPP CTA */}
        <section className="av-wa-cta">
          <p className="av-wa-eyebrow">¿Tienes algo en mente?</p>
          <h2 className="av-wa-title">Cuéntame qué quieres regalar</h2>
          <p className="av-wa-sub">Respondo en menos de 24 horas y lo diseñamos juntos, sin compromiso.</p>
          <a
            href={whatsappLink('Hola Cristina, me gustaría información sobre un regalo personalizado.')}
            className="av-wa-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribir por WhatsApp →
          </a>
        </section>

        {/* FOOTER */}
        <footer className="av-footer">
          <img src={LogotipoSvg} alt="A Mi Vera" className="av-footer-logo" />
          <nav className="av-footer-links">
            <Link to="/" className="av-footer-link">Inicio</Link>
            <Link to="/nosotros" className="av-footer-link">Nosotros</Link>
            <a href="#catalogo" className="av-footer-link">Catálogo</a>
          </nav>
          <p className="av-footer-copy">© {new Date().getFullYear()} A Mi Vera · Todos los derechos reservados</p>
        </footer>
      </>
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
