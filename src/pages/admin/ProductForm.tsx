import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import type { ProductFormData } from '../../types/product';

const EMPTY_FORM: ProductFormData = {
  title: '', price: '', category: '', description: '',
  image1: '', image2: '', image3: '', image4: '',
};

const IMAGE_FIELDS = ['image1', 'image2', 'image3', 'image4'] as const;
type ImageField = typeof IMAGE_FIELDS[number];

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined;
  const navigate = useNavigate();
  const { products, loading: prodLoading, saving, addProduct, updateProduct } = useAdminProducts();
  const { categoryNames, loading: catLoading } = useAdminCategories();
  const loading = prodLoading || catLoading;

  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formLoaded = useRef(false);

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (!isEditing || formLoaded.current || products.length === 0) return;
    const product = products.find(p => p.id === id);
    if (!product) return;
    setFormData({
      title:       product.title,
      price:       String(product.price),
      category:    product.category,
      description: product.description,
      image1:      product.images[0] ?? '',
      image2:      product.images[1] ?? '',
      image3:      product.images[2] ?? '',
      image4:      product.images[3] ?? '',
    });
    formLoaded.current = true;
  }, [id, isEditing, products]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const err = isEditing
      ? await updateProduct(id!, formData)
      : await addProduct(formData);

    if (err) {
      setSubmitError(err);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate('/admin/productos'), 2000);
  }

  // Estado: cargando (solo mientras Supabase hace el fetch inicial)
  if (loading) {
    return (
      <div className="admin-product-form">
        <p className="admin-loading-text">Cargando producto…</p>
      </div>
    );
  }

  // Estado: producto no encontrado (loading ya ha terminado)
  const productNotFound = isEditing && !products.find(p => p.id === id);

  if (productNotFound) {
    return (
      <div className="admin-product-form">
        <div className="admin-placeholder">
          <div className="admin-placeholder-icon"><Package size={36} /></div>
          <h2>Producto no encontrado</h2>
          <p>El producto que intentas editar ya no existe en la lista.</p>
          <button
            className="admin-action-btn admin-action-btn--primary"
            onClick={() => navigate('/admin/productos')}
          >
            Volver a productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-product-form">
      {success && (
        <div className="admin-success-alert">
          {isEditing ? '¡Producto actualizado!' : '¡Producto publicado!'} Redirigiendo…
        </div>
      )}

      {submitError && (
        <p className="admin-form-error">{submitError}</p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Información básica */}
        <div className="admin-form-section">
          <span className="admin-form-section-title">Información</span>

          <div className="admin-field">
            <label htmlFor="title">Nombre del producto</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej. Copa de vino personalizada"
              required
              autoFocus={!isEditing}
              disabled={saving || success}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="price">Precio (€)</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              required
              inputMode="decimal"
              disabled={saving || success}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              disabled={saving || success}
            >
              <option value="">Selecciona una categoría</option>
              {categoryNames.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe el producto brevemente…"
              disabled={saving || success}
            />
          </div>
        </div>

        {/* Imágenes */}
        <div className="admin-form-section">
          <span className="admin-form-section-title">Imágenes (URL)</span>
          <div className="admin-images-grid">
            {IMAGE_FIELDS.map((field: ImageField, i) => (
              <div key={field} className="admin-image-slot">
                <label htmlFor={field}>Imagen {i + 1}</label>
                {formData[field] && (
                  <img
                    className="admin-image-preview"
                    src={formData[field]}
                    alt={`Vista previa imagen ${i + 1}`}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <input
                  id={field}
                  name={field}
                  type="url"
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder="https://…"
                  inputMode="url"
                  disabled={saving || success}
                />
              </div>
            ))}
          </div>
          <span className="admin-field-hint">
            Pega aquí el enlace de cada imagen. La subida directa desde el móvil llegará en Fase 6.
          </span>
        </div>

        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-cancel-btn"
            onClick={() => navigate('/admin/productos')}
            disabled={saving || success}
          >
            Volver
          </button>
          <button
            type="submit"
            className="admin-submit-btn"
            disabled={saving || success}
          >
            {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Publicar producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
