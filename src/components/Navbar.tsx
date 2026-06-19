import { useState, useRef, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import LogotipoTransp from '../../IdentidadVisual/AmiVera Logo Transparent.png';

interface NavbarProps {
  isProductDetail?: boolean;
}

const Navbar = ({ isProductDetail = false }: NavbarProps) => {
  const { products } = useProductContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchClosing, setIsSearchClosing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  const closeSearch = () => {
    if (isSearchClosing) return;
    setIsSearchClosing(true);
    setTimeout(() => {
      setIsSearchOpen(false);
      setIsSearchClosing(false);
      setSearchTerm('');
    }, 260);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      closeSearch();
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const clearSearch = () => {
    closeSearch();
    navigate('/');
  };

  const closeMenuAndScrollTo = (category: string) => {
    setIsMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#cat-${category}`);
    } else {
      setTimeout(() => {
        const el = document.getElementById(`cat-${category}`);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <>
      <nav className="navbar plattsupply-nav">

        {/* Left: hamburguesa o flecha */}
        <div className="nav-left">
          {isProductDetail ? (
            <button
              type="button"
              className="nav-back-btn"
              aria-label="Volver"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
            >
              <ArrowLeft size={24} className="nav-icon" />
            </button>
          ) : (
            <Menu size={24} className="nav-icon" onClick={() => setIsMenuOpen(true)} />
          )}
        </div>

        {/* Centro: logo */}
        <Link to="/" className="nav-logo-link" onClick={clearSearch}>
          <img src={LogotipoTransp} alt="A Mi Vera" className="nav-logo" />
        </Link>

        {/* Derecha: buscar */}
        <div className="nav-right">
          {isSearchOpen ? (
            <X size={20} className="nav-icon" onClick={closeSearch} />
          ) : (
            <button
              type="button"
              className="nav-search-btn"
              onClick={() => setIsSearchOpen(true)}
            >
              Buscar
            </button>
          )}
        </div>
      </nav>

      {/* Overlay blur con animación de entrada y salida */}
      {isSearchOpen && (
        <div
          className={`nav-search-overlay${isSearchClosing ? ' closing' : ''}`}
          onClick={closeSearch}
        />
      )}

      {/* Barra de búsqueda desplegable */}
      {isSearchOpen && (
        <div className={`nav-search-bar${isSearchClosing ? ' closing' : ''}`}>
          <form onSubmit={handleSearchSubmit} className="nav-search-form">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar producto..."
              className="nav-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button type="submit" className="nav-search-submit">→</button>
          </form>
        </div>
      )}

      {/* Fullscreen Menu Drawer */}
      <div className={`nav-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <img src={LogotipoTransp} alt="A Mi Vera" className="nav-logo" />
          <X size={28} className="nav-icon close-menu" onClick={() => setIsMenuOpen(false)} />
        </div>
        <div className="nav-drawer-content">
          <ul className="nav-category-list nav-pages-list">
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Inicio</Link></li>
            <li><Link to="/nosotros" onClick={() => setIsMenuOpen(false)}>Nosotros</Link></li>
            <li><Link to="/catalogo" onClick={() => setIsMenuOpen(false)}>Catálogo</Link></li>
          </ul>
          <h3 className="nav-drawer-title">Categorías</h3>
          <ul className="nav-category-list">
            {categories.map((cat, idx) => (
              <li key={idx}>
                <a onClick={() => closeMenuAndScrollTo(cat)}>{cat}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;
