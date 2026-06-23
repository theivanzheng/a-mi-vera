import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import { toSlug } from '../lib/slug';
import LogotipoTransp from '../../IdentidadVisual/AmiVera Logo Transparent.png';

interface NavbarProps {
  isProductDetail?: boolean;
}

const Navbar = ({ isProductDetail = false }: NavbarProps) => {
  const { products } = useProductContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const categories = [...new Set(products.flatMap(p => (p as any).categories ?? [p.category]).filter(Boolean))];

  const closeMenu = () => {
    setIsMenuOpen(false);
    setSearchTerm('');
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      closeMenu();
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const goToCategory = (cat: string) => {
    closeMenu();
    navigate(`/catalogo#${toSlug(cat)}`);
  };

  return (
    <>
      <nav className="navbar plattsupply-nav">
        {/* Logo — izquierda */}
        {isProductDetail ? (
          <button
            type="button"
            className="nav-back-btn"
            aria-label="Volver"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          >
            <ArrowLeft size={22} className="nav-icon" />
          </button>
        ) : (
          <Link to="/" className="nav-logo-link" onClick={closeMenu}>
            <img src={LogotipoTransp} alt="A Mi Vera" className="nav-logo" />
          </Link>
        )}

        {/* Hamburguesa — derecha */}
        <button
          type="button"
          className="nav-hamburger"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsMenuOpen(v => !v)}
        >
          {isMenuOpen
            ? <X size={22} strokeWidth={1.5} className="nav-icon" />
            : <Menu size={22} strokeWidth={1.5} className="nav-icon" />
          }
        </button>
      </nav>

      {/* Backdrop difuminado */}
      {isMenuOpen && <div className="nav-backdrop" onClick={closeMenu} />}

      {/* Drawer — se despliega de arriba hacia abajo */}
      <div className={`nav-drawer${isMenuOpen ? ' open' : ''}`}>

        {/* 1. Buscar */}
        <div className="nav-drawer-section">
          <p className="nav-drawer-eyebrow">Buscar</p>
          <form onSubmit={handleSearchSubmit} className="nav-drawer-search-form">
            <input
              type="text"
              className="nav-drawer-search-input"
              placeholder="¿Qué estás buscando?"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="nav-drawer-search-submit">→</button>
          </form>
        </div>

        <div className="nav-drawer-divider" />

        {/* 2. Páginas */}
        <nav className="nav-drawer-section nav-drawer-pages">
          <p className="nav-drawer-eyebrow">Páginas</p>
          <Link to="/"         className="nav-drawer-link" onClick={closeMenu}>Inicio</Link>
          <Link to="/catalogo" className="nav-drawer-link" onClick={closeMenu}>Catálogo</Link>
          <Link to="/nosotros" className="nav-drawer-link" onClick={closeMenu}>Nosotros</Link>
        </nav>

        <div className="nav-drawer-divider" />

        {/* 3. Categorías */}
        <div className="nav-drawer-section">
          <p className="nav-drawer-eyebrow">Categorías</p>
          <div className="nav-drawer-cat-list">
            {categories.map((cat, i) => (
              <button
                key={i}
                className="nav-drawer-cat-btn"
                onClick={() => goToCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

export default Navbar;
