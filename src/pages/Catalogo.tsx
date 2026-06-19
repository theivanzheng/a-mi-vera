import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import Navbar from '../components/Navbar';

const Catalogo = () => {
  const { products, categories, loading } = useProducts();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allCategories = ['Todos', ...categories.filter(c => c !== 'Todos')];

  const filteredProducts = activeCategory && activeCategory !== 'Todos'
    ? products.filter(p => (p.categories ?? []).includes(activeCategory))
    : products;

  // Group products by category (only when "Todos" is selected)
  const groupedContent = () => {
    if (activeCategory && activeCategory !== 'Todos') {
      return (
        <div className="cat-grid">
          {filteredProducts.map(p => (
            <CatProductCard key={p.id} product={p} />
          ))}
        </div>
      );
    }

    return (
      <>
        {categories.map(cat => {
          const items = products.filter(p => (p.categories ?? []).includes(cat));
          if (items.length === 0) return null;
          return (
            <div key={cat} className="cat-group">
              <h2 className="cat-group-title">{cat.toUpperCase()}</h2>
              <div className="cat-grid">
                {items.map(p => (
                  <CatProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          );
        })}
        {/* Uncategorized products */}
        {(() => {
          const uncategorized = products.filter(p => !p.categories || p.categories.length === 0);
          if (uncategorized.length === 0) return null;
          return (
            <div className="cat-group">
              <h2 className="cat-group-title">OTROS</h2>
              <div className="cat-grid">
                {uncategorized.map(p => (
                  <CatProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          );
        })()}
      </>
    );
  };

  return (
    <div className="store-container">
      <Navbar />

      <div className="cat-page">
        {/* Page header */}
        <header className="cat-header">
          <h1 className="cat-page-title">Catálogo</h1>
          <p className="cat-page-sub">Todos nuestros regalos personalizados</p>
        </header>

        {/* Sticky category filter tabs */}
        <div className="cat-filters-wrap">
          <div className="cat-filters">
            {allCategories.map(cat => (
              <button
                key={cat}
                className={`cat-filter-tab${(activeCategory ?? 'Todos') === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat === 'Todos' ? null : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <main className="cat-main">
          {loading ? (
            <p className="cat-loading">Cargando productos…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="cat-empty">No hay productos en esta categoría.</p>
          ) : (
            groupedContent()
          )}
        </main>
      </div>
    </div>
  );
};

interface CatCardProps {
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    images?: string[];
  };
}

const CatProductCard = ({ product }: CatCardProps) => (
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
