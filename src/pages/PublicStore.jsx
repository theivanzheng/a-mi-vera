import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import Logotipo from '../../IdentidadVisual/Logo_AmiVera.png';
import HeroVideo from '../assets/AmiVera_Hero_Background.mp4';

const PublicStore = () => {
  const { products, categories } = useContext(ProductContext);
  const location = useLocation();

  // Parse search query
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q') || '';

  // Group products by category
  const categorizedProducts = categories.map(cat => ({
    category: cat,
    items: products.filter(p => p.category === cat)
  })).filter(group => group.items.length > 0);

  // Filter products for Search
  const searchResults = products.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="store-container">
      <Navbar />

      {searchQuery ? (
        <main className="main-content platsupply-layout" style={{ paddingTop: '100px', minHeight: '80vh' }}>
          <h2>Resultados para: "{searchQuery}"</h2>
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
            <div className="no-products">
              No hay productos que coincidan con tu búsqueda.
            </div>
          )}
        </main>
      ) : (
        <>
          {/* Hero Section Corto */}
          <header className="hero-section plattsupply-hero">
            <video
              className="hero-video-bg"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={HeroVideo} type="video/mp4" />
            </video>
            <div className="hero-bg-overlay"></div>
            <div className="hero-content">
              <span className="hero-pill">NUEVA COLECCIÓN</span>
              <h1 className="hero-title">Regalos que dejan huella esta temporada</h1>
              <p className="hero-subtitle">Detalles personalizados para toda ocasión. Originales y únicos en cada entrega.</p>
              <a href="#catalogo" className="cta-button primary-dark">Ver el catálogo</a>
            </div>
          </header>

          {/* Main Content: Category Carousels */}
          <main id="catalogo" className="main-content platsupply-layout">
            {categorizedProducts.map((group, index) => (
              <section id={`cat-${group.category}`} key={index} className="category-section">
                <div className="section-header-mobile">
                  <h2>{group.category}</h2>
                  <button className="view-all-btn">Ver todos</button>
                </div>
                
                <div className="horizontal-scroll-container">
                  {group.items.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </main>
        </>
      )}

      <footer className="footer">
        <div className="footer-content">
          <img src={Logotipo} alt="A Mi Vera Logo" className="footer-logo darker" />
          <p>&copy; {new Date().getFullYear()} A Mi Vera. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicStore;
