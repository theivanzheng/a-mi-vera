import React, { useContext, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductContext } from '../context/ProductContext';
import Navbar from '../components/Navbar';
import { MessageCircle } from 'lucide-react';
import Logotipo from '../../IdentidadVisual/Logo_AmiVera.png';

const ProductDetail = () => {
  const { id } = useParams();
  const { products } = useContext(ProductContext);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const product = products.find(p => p.id === Number(id) || p.id === id);

  if (!product) {
    return (
      <div className="store-container" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h2>Producto no encontrado</h2>
        <Link to="/" style={{ color: 'blue', textDecoration: 'underline' }}>Volver a la tienda</Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) ? product.images : [product.image];
  const mainImage = images[0] || 'https://via.placeholder.com/600?text=Sin+Imagen';

  // Obtener recomendados de la misma categoría (excluyendo el actual)
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Fallback si no hay de la misma categoría: aleatorios
  const finalRelated = relatedProducts.length > 0 
    ? relatedProducts 
    : products.filter(p => p.id !== product.id).slice(0, 4);

  const handleWhatsappClick = () => {
    const text = `Hola, me interesa encargar: ${product.title}`;
    window.open(`https://wa.me/34646555027?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="store-container pdp-page">
      <Navbar isProductDetail={true} />

      <main className="pdp-main-content">
        {/* Imagen Gigante Principal */}
        <div className="pdp-image-container">
          <img src={mainImage} alt={product.title} className="pdp-main-image" />
        </div>

        {/* Detalles del Producto */}
        <div className="pdp-details">
          <h1 className="pdp-title">{product.title}</h1>
          <p className="pdp-price">${Number(product.price).toFixed(2)}</p>

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

        {/* Artículos que también te puedan gustar */}
        {finalRelated.length > 0 && (
          <section className="pdp-recommended">
            <h2>You may also like</h2>
            <div className="recommended-grid">
              {finalRelated.map(item => {
                const itemImages = Array.isArray(item.images) ? item.images : [item.image];
                const itemThumb = itemImages[0] || 'https://via.placeholder.com/300?text=Sin+Imagen';
                return (
                  <Link to={`/producto/${item.id}`} key={item.id} className="Plattsupply-card recommended-card">
                    <div className="product-image-container">
                      <img src={itemThumb} alt={item.title} className="product-image" loading="lazy" />
                    </div>
                    <div className="product-info">
                      <h3 className="product-title">{item.title}</h3>
                      <div className="product-price">${Number(item.price).toFixed(2)}</div>
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
