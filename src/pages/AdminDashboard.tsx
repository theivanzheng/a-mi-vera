import { useState, ChangeEvent, FormEvent } from 'react';
import { useProductContext } from '../context/ProductContext';
import { ArrowLeft, Upload, Plus, Package, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Logotipo from '../../IdentidadVisual/Logo_AmiVera.png';
import type { ProductFormData, Product } from '../types/product';

const EMPTY_FORM: ProductFormData = {
  title: '',
  price: '',
  category: '',
  description: '',
  image1: '',
  image2: '',
  image3: '',
  image4: '',
};

const IMAGE_FIELDS = ['image1', 'image2', 'image3', 'image4'] as const;
type ImageField = typeof IMAGE_FIELDS[number];

const AdminDashboard = () => {
  const { addProduct } = useProductContext();

  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewMode, setPreviewMode] = useState<'main' | 'detail'>('main');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, imageName: ImageField) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [imageName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [imageName]: '' }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.category || !formData.image1) {
      alert('Por favor, rellena todos los campos obligatorios (al menos la Imagen 1).');
      return;
    }

    addProduct(formData);
    setSuccessMsg('¡Producto añadido con éxito!');
    setFormData(EMPTY_FORM);
    e.currentTarget.reset();

    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const previewProduct: Product = {
    id: 0,
    title: formData.title || 'Título del Producto',
    price: parseFloat(formData.price) || 0,
    category: formData.category,
    description: formData.description,
    images: [formData.image1].filter(Boolean),
  };

  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} /> Volver a la Tienda
        </Link>
        <img src={Logotipo} alt="Logo" className="admin-logo" />
      </nav>

      <div className="admin-content">
        <div className="admin-header">
          <h1>Panel de Administración</h1>
          <p>Añade nuevos productos a tu escaparate virtual.</p>
        </div>

        <div className="admin-card">
          <div className="card-header">
            <Package className="icon" />
            <h2>Nuevo Producto</h2>
          </div>

          {successMsg && <div className="success-alert">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="title">Nombre del Artículo *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej. Taza Personalizada"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Precio (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ej. 25.99"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Categoría *</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Ej. Cerámica, Madera, Textil..."
                  required
                  list="categories"
                />
                <datalist id="categories">
                  <option value="Detalles con magia" />
                  <option value="Regalos con foto" />
                  <option value="Pasión por la madera" />
                  <option value="Pasión por el vino" />
                  <option value="Maestros cerveceros" />
                  <option value="Especial primera comunión" />
                  <option value="Regalos únicos" />
                  <option value="Novedades" />
                  <option value="Nuestros peques" />
                  <option value="Somos de cava" />
                  <option value="Vivan los novios" />
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Breve descripción del producto..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Sube tus Imágenes desde el Móvil o PC (Hasta 4)</label>
              {IMAGE_FIELDS.map((imageName, idx) => (
                <div key={imageName} className="image-input-container" style={{ marginBottom: '0.5rem' }}>
                  <Upload className="input-icon" size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    id={imageName}
                    name={imageName}
                    onChange={(e) => handleFileChange(e, imageName)}
                    required={idx === 0}
                    style={{ padding: '0.6rem 0.6rem 0.6rem 2.8rem' }}
                  />
                </div>
              ))}
              <small>La Imagen 1 es obligatoria. Escoge de la galería. ¡Nota: como esto es un prototipo local temporal, usa fotos poco pesadas para no llenar el navegador!</small>
            </div>

            {formData.image1 && (
              <div className="admin-preview-section">
                <h3>Previsualización en Vivo</h3>
                <div className="preview-tabs">
                  <button type="button" className={previewMode === 'main' ? 'active' : ''} onClick={() => setPreviewMode('main')}>
                    Página Principal
                  </button>
                  <button type="button" className={previewMode === 'detail' ? 'active' : ''} onClick={() => setPreviewMode('detail')}>
                    Página de Detalle
                  </button>
                </div>

                <div className="preview-mobile-mock">
                  <div className="mock-screen">
                    {previewMode === 'main' ? (
                      <div className="preview-main" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                          <ProductCard product={previewProduct} disabledLink={true} />
                        </div>
                      </div>
                    ) : (
                      <div className="preview-detail">
                        <div className="pdp-image-container" style={{ margin: 0 }}>
                          <img src={formData.image1} alt="Preview" className="pdp-main-image" />
                        </div>
                        <div className="pdp-details" style={{ padding: '20px' }}>
                          <h1 className="pdp-title" style={{ fontSize: '1.4rem' }}>{formData.title || 'Título del Producto'}</h1>
                          <p className="pdp-price" style={{ fontSize: '1rem' }}>${(parseFloat(formData.price) || 0).toFixed(2)}</p>
                          <button type="button" className="pdp-whatsapp-btn" style={{ fontSize: '0.85rem' }} disabled>
                            <MessageCircle size={16} /> Llevarte a hacer el pedido en WhatsApp
                          </button>
                          <div className="pdp-description" style={{ fontSize: '0.8rem' }}>
                            {(formData.description || 'Aquí irá la descripción de tu producto.').split('\n').map((p, i) => <p key={i}>{p}</p>)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="submit-btn" style={{ marginTop: '2rem' }}>
              <Plus size={20} /> Publicar Producto
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
