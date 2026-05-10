import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProductProvider } from './context/ProductContext';
import PublicStore from './pages/PublicStore';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';
import './App.css'; 

function App() {
  return (
    <ProductProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicStore />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ProductProvider>
  );
}

export default App;
