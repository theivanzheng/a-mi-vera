import { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  disabledLink?: boolean;
}

const ProductCard = ({ product, disabledLink = false }: ProductCardProps) => {
  const mainImage = product.images[0] ?? 'https://via.placeholder.com/600?text=Sin+Imagen';

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (disabledLink) {
      e.preventDefault();
    }
  };

  return (
    <Link
      to={disabledLink ? '#' : `/producto/${product.slug}`}
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
