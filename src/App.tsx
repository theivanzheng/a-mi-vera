import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider } from './context/AuthContext';

// Tienda pública
import PublicLayout from './components/PublicLayout';
import PublicStore from './pages/PublicStore';
import ProductDetail from './pages/ProductDetail';
import Catalogo from './pages/Catalogo';
import Bodas from './pages/Bodas';
import WeddingPlanners from './pages/WeddingPlanners';
import Nosotros from './pages/Nosotros';

// Auth
import Login from './pages/admin/Login';

// Panel privado — guard y layout
import PrivateRoute from './router/PrivateRoute';
import AdminLayout from './components/admin/AdminLayout';

// Vistas admin
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import CategoryList from './pages/admin/CategoryList';
import StockManager from './pages/admin/StockManager';
import HomeEditor from './pages/admin/HomeEditor';
import PaginasList from './pages/admin/PaginasList';
import PageEditor from './pages/admin/PageEditor';

import './index.css';
import './App.css';

function App() {
  return (
    <ProductProvider>
      <AuthProvider>
      <Router>
        <Routes>
          {/* Tienda pública — navbar persistente + transición fade-up */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<PublicStore />} />
            <Route path="/producto/:slug" element={<ProductDetail />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/nosotros" element={<Nosotros />} />
            <Route path="/bodas" element={<Bodas />} />
            <Route path="/bodas/wedding-planners" element={<WeddingPlanners />} />
          </Route>

          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Panel privado (protegido) */}
          <Route element={<PrivateRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/productos" element={<ProductList />} />
              <Route path="/admin/productos/nuevo" element={<ProductForm />} />
              <Route path="/admin/productos/:id/editar" element={<ProductForm />} />
              <Route path="/admin/categorias" element={<CategoryList />} />
              <Route path="/admin/stock" element={<StockManager />} />
              <Route path="/admin/portada" element={<HomeEditor />} />
              <Route path="/admin/paginas" element={<PaginasList />} />
            </Route>
            {/* Editor de páginas a pantalla completa (fuera del AdminLayout) */}
            <Route path="/admin/paginas/:slug/editar" element={<PageEditor />} />
          </Route>
        </Routes>
      </Router>
      </AuthProvider>
    </ProductProvider>
  );
}

export default App;
