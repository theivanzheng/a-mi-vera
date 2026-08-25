import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { MessageCircle, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { whatsappLink, SITE_URL } from '../lib/whatsapp';
import { toSlug } from '../lib/slug';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/600?text=Sin+Imagen';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useProducts();
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImage(0);
  }, [slug]);

  if (loading) {
    return (
      <div className="store-container">
        <p style={{ marginTop: '120px', textAlign: 'center' }}>Cargando producto…</p>
      </div>
    );
  }

  // Busca primero por slug (ruta normal), luego por id (compat. con enlaces UUID antiguos)
  const product = products.find(p => p.slug === slug)
    ?? products.find(p => p.id === slug);

  if (!product) {
    return (
      <div className="store-container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2 style={{ marginTop: '120px' }}>Producto no encontrado</h2>
        <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>Volver a la tienda</Link>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [PLACEHOLDER_IMAGE];
  const mainImage = images[activeImage] ?? images[0];
  const showArrows = images.length > 1;
  const goPrev = () => setActiveImage(i => (i - 1 + images.length) % images.length);
  const goNext = () => setActiveImage(i => (i + 1) % images.length);

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const finalRelated = relatedProducts.length > 0
    ? relatedProducts
    : products.filter(p => p.id !== product.id).slice(0, 4);

  const handleWhatsappClick = () => {
    const url = `${SITE_URL}/producto/${product.slug}`;
    const text = `Hola, me interesa este producto: ${product.title}\n${url}`;
    window.open(whatsappLink(text), '_blank');
  };

  const backTo = product.category ? `/catalogo#${toSlug(product.category)}` : '/catalogo';
  const backLabel = product.category || 'Catálogo';

  return (
    <div className="store-container pdp-page">
      <div className="pdp-back-bar">
        <Link to={backTo} className="pdp-back-link">
          <ArrowLeft size={16} /> {backLabel}
        </Link>
      </div>

      <main className="pdp-main-content">
        <div className="pdp-image-container">
          <img src={mainImage} alt={product.title} className="pdp-main-image" />
          {showArrows && (
            <>
              <button
                type="button"
                className="pdp-arrow pdp-arrow--prev"
                onClick={goPrev}
                aria-label="Foto anterior"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                className="pdp-arrow pdp-arrow--next"
                onClick={goNext}
                aria-label="Foto siguiente"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="pdp-thumbs">
            {images.map((img, idx) => (
              <button
                key={img + idx}
                type="button"
                className={`pdp-thumb${idx === activeImage ? ' pdp-thumb--active' : ''}`}
                onClick={() => setActiveImage(idx)}
                aria-label={`Ver foto ${idx + 1} de ${product.title}`}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="pdp-details">
          <h1 className="pdp-title">{product.title}</h1>
          <p className="pdp-price">{product.price.toFixed(2)} €</p>

          <button onClick={handleWhatsappClick} className="pdp-whatsapp-btn">
            <MessageCircle size={20} /> Llevarte a hacer el pedido en WhatsApp
          </button>

          <div className="pdp-promo-text">
            Envío personalizado en todos nuestros productos.
          </div>

          <div className="pdp-description">
            {product.description.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        {finalRelated.length > 0 && (
          <section className="pdp-recommended">
            <h2>También te puede gustar</h2>
            <div className="recommended-grid">
              {finalRelated.map(item => {
                const itemThumb = item.images[0] ?? 'https://via.placeholder.com/300?text=Sin+Imagen';
                return (
                  <Link to={`/producto/${item.slug}`} key={item.id} className="Plattsupply-card recommended-card">
                    <div className="product-image-container">
                      <img src={itemThumb} alt={item.title} className="product-image" loading="lazy" />
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{item.title}</h3>
                      <div className="product-price">{item.price.toFixed(2)} €</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="av-footer">
        <img src={LogotipoSvg} alt="A Mi Vera" className="av-footer-logo" />
        <nav className="av-footer-links">
          <Link to="/" className="av-footer-link">Inicio</Link>
          <Link to="/nosotros" className="av-footer-link">Nosotros</Link>
          <Link to="/catalogo" className="av-footer-link">Catálogo</Link>
        </nav>
        <p className="av-footer-copy">© {new Date().getFullYear()} A Mi Vera · Todos los derechos reservados</p>
        <a
          href="https://theivanzheng.com"
          target="_blank"
          rel="noopener noreferrer"
          className="av-footer-credit"
        >
          Diseño y desarrollo: @theivanzheng
        </a>
      </footer>
    </div>
  );
};

export default ProductDetail;
