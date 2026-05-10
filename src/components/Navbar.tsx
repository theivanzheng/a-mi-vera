import { useState, useEffect, useRef, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, User, ShoppingBag, X, ArrowLeft } from 'lucide-react';
import { useProductContext } from '../context/ProductContext';
import Logotipo from '../../IdentidadVisual/Logo_AmiVera.png';

interface NavbarProps {
  isProductDetail?: boolean;
}

const Navbar = ({ isProductDetail = false }: NavbarProps) => {
  const { products } = useProductContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      setIsSearchOpen(false);
      navigate(`/?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
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

        {/* Left Side: Icons or Search Input */}
        <div className="nav-icons-group">
          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="nav-search-form">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar producto..."
                className="nav-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <X size={20} className="nav-icon" onClick={() => setIsSearchOpen(false)} style={{ cursor: 'pointer', marginLeft: '8px' }} />
            </form>
          ) : (
            <>
              {isProductDetail ? (
                <Link to="/" style={{ color: 'inherit' }}><ArrowLeft size={24} className="nav-icon" /></Link>
              ) : (
                <Menu size={24} className="nav-icon" onClick={() => setIsMenuOpen(true)} />
              )}
              <Search size={24} className="nav-icon" onClick={() => setIsSearchOpen(true)} />
            </>
          )}
        </div>

        {/* Logo Middle */}
        {!isSearchOpen && (
          <Link to="/" onClick={clearSearch}>
            <img src={Logotipo} alt="A Mi Vera Logo" className="logo nav-logo" />
          </Link>
        )}

        {/* Right Side */}
        <div className="nav-icons-group right">
          <User size={24} className="nav-icon" />
          <ShoppingBag size={24} className="nav-icon" />
        </div>
      </nav>

      {/* Fullscreen Menu Drawer */}
      <div className={`nav-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="nav-drawer-header">
          <img src={Logotipo} alt="Logo" className="nav-logo" />
          <X size={28} className="nav-icon close-menu" onClick={() => setIsMenuOpen(false)} />
        </div>
        <div className="nav-drawer-content">
          <h3 className="nav-drawer-title">Descubre el catálogo</h3>
          <ul className="nav-category-list">
            <li>
              <a onClick={() => closeMenuAndScrollTo('todos')}>Todo nuestro surtido</a>
            </li>
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
