import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import Navbar from '../components/Navbar';

const Destacados = () => {
  const { products, categories, loading } = useProducts();

  const featured = products.filter(p => p.destacado);
  const displayFeatured = featured.length > 0 ? featured : products.slice(0, 8);

  // Auto-pick a recommended category: the one with the most products that aren't all featured
  const recommendedCategory = (() => {
    if (categories.length === 0) return null;
    const scored = categories
      .map(cat => ({
        cat,
        items: products.filter(p => (p.categories ?? []).includes(cat) && !p.destacado),
      }))
      .filter(g => g.items.length > 0)
      .sort((a, b) => b.items.length - a.items.length);
    return scored[0] ?? null;
  })();

  return (
    <div className="store-container">
      <Navbar />

      <div className="dest-page">
        {/* Page header */}
        <header className="dest-header">
          <p className="dest-eyebrow">Selección especial</p>
          <h1 className="dest-page-title">Productos Destacados</h1>
        </header>

        {/* Featured products grid */}
        <main className="dest-main">
          {loading ? (
            <p className="cat-loading">Cargando productos…</p>
          ) : displayFeatured.length === 0 ? (
            <p className="cat-empty">No hay productos destacados por ahora.</p>
          ) : (
            <div className="cat-grid">
              {displayFeatured.map(p => (
                <Link key={p.id} to={`/producto/${p.slug}`} className="cat-card">
                  <div className="cat-card-img">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} loading="lazy" />
                    ) : (
                      <div className="cat-card-placeholder" />
                    )}
                  </div>
                  <div className="cat-card-info">
                    <span className="cat-card-name">{p.title}</span>
                    <span className="cat-card-price">{p.price} €</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        {/* Recommended category carousel */}
        {!loading && recommendedCategory && (
          <section className="dest-recommend">
            <div className="dest-recommend-header">
              <p className="dest-recommend-label">También te puede interesar</p>
              <h2 className="dest-recommend-title">{recommendedCategory.cat}</h2>
              <Link
                to={`/catalogo`}
                className="dest-recommend-ver"
                onClick={() => {}}
              >
                Ver categoría →
              </Link>
            </div>
            <div className="dest-carousel">
              {recommendedCategory.items.map(p => (
                <Link key={p.id} to={`/producto/${p.slug}`} className="dest-carousel-card">
                  <div className="dest-carousel-img">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} loading="lazy" />
                    ) : (
                      <div className="cat-card-placeholder" />
                    )}
                  </div>
                  <span className="dest-carousel-name">{p.title}</span>
                  <span className="dest-carousel-price">{p.price} €</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Destacados;
