import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product, disabledLink = false }) => {
  const images = Array.isArray(product.images) ? product.images : [product.image];
  // Fallback to placeholder if not loaded yet
  const mainImage = images[0] || product.image1 || 'https://via.placeholder.com/600?text=Sin+Imagen';

  const handleClick = (e) => {
    if (disabledLink) {
      e.preventDefault();
    }
  };

  return (
    <Link 
      to={disabledLink ? "#" : `/producto/${product.id}`}
      onClick={handleClick}
      className="Plattsupply-card"
    >
      <div className="product-image-container">
        <div className="product-category-tag">DESTACADO</div>
        <img src={mainImage} alt={product.title} className="product-image" loading="lazy" />
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.title || 'Título del Producto'}</h3>
        <div className="product-price">{Number(product.price || 0).toFixed(2)} €</div>
      </div>
    </Link>
  );
};

export default ProductCard;
