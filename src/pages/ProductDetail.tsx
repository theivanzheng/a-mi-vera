import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { MessageCircle } from 'lucide-react';
import Logotipo from '../../IdentidadVisual/Logo_AmiVera.png';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useProducts();

  useEffect(() => {
    window.scrollTo(0, 0);
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

  const mainImage = product.images[0] ?? 'https://via.placeholder.com/600?text=Sin+Imagen';

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const finalRelated = relatedProducts.length > 0
    ? relatedProducts
    : products.filter(p => p.id !== product.id).slice(0, 4);

  const handleWhatsappClick = () => {
    const text = `Hola, me interesa encargar: ${product.title}`;
    window.open(`https://wa.me/34646555027?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="store-container pdp-page">
      <main className="pdp-main-content">
        <div className="pdp-image-container">
          <img src={mainImage} alt={product.title} className="pdp-main-image" />
        </div>

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

      <footer className="footer">
        <div className="footer-content">
          <img src={Logotipo} alt="A Mi Vera Logo" className="footer-logo darker" />
          <p>&copy; {new Date().getFullYear()} A Mi Vera. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetail;
