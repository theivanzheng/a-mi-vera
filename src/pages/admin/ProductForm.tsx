import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Upload, X } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import type { ImageEntry, ProductTextFields, ProgressFn } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { isSupabaseConfigured } from '../../lib/supabase';
import { validateImageFile, resizeImage } from '../../lib/storageApi';

// ── Tipos locales ──────────────────────────────────────────────────────────

interface TextFields {
  title: string;
  price: string;
  category: string;
  description: string;
  // Campos URL solo usados en el fallback (sin Supabase)
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}

interface ImageSlot {
  file: File | null;          // archivo nuevo (null si no hay upload pendiente)
  previewUrl: string;         // blob URL (nuevo) o URL pública (existente)
  storagePath: string | null; // ruta de Storage existente (null si URL externa)
  legacyUrl: string | null;   // URL externa existente (null si Storage o vacío)
  compressing: boolean;       // true mientras resizeImage() está procesando
}

const EMPTY_SLOT: ImageSlot = {
  file: null, previewUrl: '', storagePath: null, legacyUrl: null, compressing: false,
};
const PLACEHOLDER = 'https://via.placeholder.com/600?text=Sin+Imagen';
const EMPTY_FORM: TextFields = {
  title: '', price: '', category: '', description: '',
  image1: '', image2: '', image3: '', image4: '',
};

// ── Componente ─────────────────────────────────────────────────────────────

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined;
  const navigate = useNavigate();

  const { products, loading: prodLoading, saving, addProduct, updateProduct } = useAdminProducts();
  const { categoryNames, loading: catLoading } = useAdminCategories();
  const loading = prodLoading || catLoading;

  const [formData, setFormData] = useState<TextFields>(EMPTY_FORM);
  const [imageSlots, setImageSlots] = useState<[ImageSlot, ImageSlot, ImageSlot, ImageSlot]>([
    { ...EMPTY_SLOT }, { ...EMPTY_SLOT }, { ...EMPTY_SLOT }, { ...EMPTY_SLOT },
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savePhase, setSavePhase] = useState<'uploading' | 'saving' | null>(null);
  const formLoaded = useRef(false);
  // Rutas de Storage que tenía el producto al entrar en edición (para cleanup posterior)
  const initialStoragePathsRef = useRef<string[]>([]);

  // Liberar blob URLs al desmontar
  useEffect(() => {
    return () => {
      imageSlots.forEach(slot => {
        if (slot.file) URL.revokeObjectURL(slot.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (!isEditing || formLoaded.current || products.length === 0) return;
    const product = products.find(p => p.id === id);
    if (!product) return;

    setFormData(prev => ({
      ...prev,
      title: product.title,
      price: String(product.price),
      category: product.category,
      description: product.description,
    }));

    if (isSupabaseConfigured) {
      // Modo Supabase: poblar slots con imágenes existentes
      const paths = product.imagePaths ?? [];
      const slots: ImageSlot[] = paths.map((storagePath, i) => {
        const pubUrl = product.images[i] ?? '';
        if (storagePath) {
          return { file: null, previewUrl: pubUrl, storagePath, legacyUrl: null };
        }
        const legacyUrl = pubUrl !== PLACEHOLDER ? pubUrl : '';
        return legacyUrl
          ? { file: null, previewUrl: legacyUrl, storagePath: null, legacyUrl }
          : { ...EMPTY_SLOT };
      });
      while (slots.length < 4) slots.push({ ...EMPTY_SLOT });
      setImageSlots(slots.slice(0, 4) as typeof imageSlots);

      initialStoragePathsRef.current = paths.filter((p): p is string => p !== null);
    } else {
      // Modo fallback: poblar campos URL
      setFormData(prev => ({
        ...prev,
        image1: product.images[0] !== PLACEHOLDER ? (product.images[0] ?? '') : '',
        image2: product.images[1] !== PLACEHOLDER ? (product.images[1] ?? '') : '',
        image3: product.images[2] !== PLACEHOLDER ? (product.images[2] ?? '') : '',
        image4: product.images[3] !== PLACEHOLDER ? (product.images[3] ?? '') : '',
      }));
    }

    formLoaded.current = true;
  }, [id, isEditing, products]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleFileChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const err = validateImageFile(file);
    if (err) {
      setSubmitError(err);
      e.target.value = '';
      return;
    }
    setSubmitError(null);

    // Mostrar estado comprimiendo inmediatamente
    setImageSlots(prev => {
      const next = [...prev] as typeof prev;
      if (next[index].file) URL.revokeObjectURL(next[index].previewUrl);
      next[index] = { ...EMPTY_SLOT, compressing: true };
      return next;
    });

    const optimized = await resizeImage(file);

    setImageSlots(prev => {
      const next = [...prev] as typeof prev;
      next[index] = {
        file: optimized,
        previewUrl: URL.createObjectURL(optimized),
        storagePath: null,
        legacyUrl: null,
        compressing: false,
      };
      return next;
    });
  }

  function clearSlot(index: number) {
    setImageSlots(prev => {
      const next = [...prev] as typeof prev;
      if (next[index].file) URL.revokeObjectURL(next[index].previewUrl);
      next[index] = { ...EMPTY_SLOT };
      return next;
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const fields: ProductTextFields = {
      title: formData.title,
      price: formData.price,
      category: formData.category,
      description: formData.description,
    };

    // Construir entradas de imagen según el modo
    let imageEntries: ImageEntry[];

    if (isSupabaseConfigured) {
      imageEntries = imageSlots
        .filter(s => s.file !== null || s.storagePath !== null || s.legacyUrl !== null)
        .map(s => {
          if (s.file) return { kind: 'file' as const, file: s.file };
          if (s.storagePath) return { kind: 'storage_path' as const, path: s.storagePath };
          return { kind: 'url' as const, url: s.legacyUrl! };
        });
    } else {
      // Fallback sin Supabase: recoger URLs de los inputs de texto
      imageEntries = (
        [formData.image1, formData.image2, formData.image3, formData.image4] as string[]
      )
        .filter(u => u.trim().length > 0)
        .map(url => ({ kind: 'url' as const, url }));
    }

    const onProgress: ProgressFn = (phase) => setSavePhase(phase);

    const err = isEditing
      ? await updateProduct(id!, fields, imageEntries, initialStoragePathsRef.current, onProgress)
      : await addProduct(fields, imageEntries, onProgress);

    setSavePhase(null);

    if (err) {
      setSubmitError(err);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate('/admin/productos'), 2000);
  }

  // ── Estados de carga / error ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="admin-product-form">
        <p className="admin-loading-text">Cargando producto…</p>
      </div>
    );
  }

  if (isEditing && !products.find(p => p.id === id)) {
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

  const disabled = saving || success;
  const filledSlots = imageSlots.filter(s => s.file || s.storagePath || s.legacyUrl).length;

  // ── Render ─────────────────────────────────────────────────────────────────

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
        {/* ── Información básica ─── */}
        <div className="admin-form-section">
          <span className="admin-form-section-title">Información</span>

          <div className="admin-field">
            <label htmlFor="title">Nombre del producto</label>
            <input
              id="title" name="title" type="text"
              value={formData.title} onChange={handleChange}
              placeholder="Ej. Copa de vino personalizada"
              required autoFocus={!isEditing} disabled={disabled}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="price">Precio (€)</label>
            <input
              id="price" name="price" type="number"
              min="0" step="0.01"
              value={formData.price} onChange={handleChange}
              placeholder="0.00" required inputMode="decimal" disabled={disabled}
            />
          </div>

          <div className="admin-field">
            <label htmlFor="category">Categoría</label>
            <select
              id="category" name="category"
              value={formData.category} onChange={handleChange}
              required disabled={disabled}
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
              id="description" name="description"
              value={formData.description} onChange={handleChange}
              placeholder="Describe el producto brevemente…"
              disabled={disabled}
            />
          </div>
        </div>

        {/* ── Imágenes ─── */}
        <div className="admin-form-section">
          {isSupabaseConfigured ? (
            <>
              <span className="admin-form-section-title">
                Imágenes ({filledSlots}/4)
              </span>

              <div className="admin-images-grid">
                {imageSlots.map((slot, i) => (
                  <div key={i} className="admin-image-slot">
                    <span className="admin-upload-label">Imagen {i + 1}</span>

                    {slot.compressing ? (
                      <div className="admin-upload-compressing">
                        <span>Preparando…</span>
                      </div>
                    ) : slot.previewUrl ? (
                      <div className="admin-upload-preview-wrap">
                        <img
                          className="admin-upload-preview"
                          src={slot.previewUrl}
                          alt={`Vista previa ${i + 1}`}
                        />
                        {!disabled && (
                          <>
                            <button
                              type="button"
                              className="admin-upload-remove"
                              onClick={() => clearSlot(i)}
                              aria-label="Eliminar imagen"
                            >
                              <X size={14} />
                            </button>
                            <label
                              htmlFor={`img-file-${i}`}
                              className="admin-upload-change"
                              title="Cambiar imagen"
                            >
                              <Upload size={12} />
                            </label>
                          </>
                        )}
                        {slot.file && (
                          <span className="admin-upload-badge">Nueva</span>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor={`img-file-${i}`}
                        className={`admin-upload-dropzone${disabled ? ' admin-upload-dropzone--disabled' : ''}`}
                      >
                        <Upload size={20} />
                        <span>Seleccionar</span>
                      </label>
                    )}

                    <input
                      id={`img-file-${i}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="admin-upload-input"
                      disabled={disabled}
                      onChange={e => handleFileChange(i, e)}
                    />
                  </div>
                ))}
              </div>

              <span className="admin-field-hint">
                JPG, PNG o WEBP · máximo 5 MB por imagen.
              </span>
            </>
          ) : (
            <>
              <span className="admin-form-section-title">Imágenes (URL)</span>
              <div className="admin-images-grid">
                {(['image1', 'image2', 'image3', 'image4'] as const).map((field, i) => (
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
                      id={field} name={field} type="url"
                      value={formData[field]} onChange={handleChange}
                      placeholder="https://…" inputMode="url" disabled={disabled}
                    />
                  </div>
                ))}
              </div>
              <span className="admin-field-hint">
                Pega aquí el enlace de cada imagen.
              </span>
            </>
          )}
        </div>

        {/* ── Acciones ─── */}
        <div className="admin-form-actions">
          <button
            type="button" className="admin-cancel-btn"
            onClick={() => navigate('/admin/productos')}
            disabled={disabled}
          >
            Volver
          </button>
          <button type="submit" className="admin-submit-btn" disabled={disabled}>
            {success
              ? 'Producto guardado correctamente'
              : savePhase === 'uploading'
                ? 'Subiendo imágenes…'
                : savePhase === 'saving'
                  ? 'Guardando producto…'
                  : saving
                    ? 'Guardando…'
                    : isEditing
                      ? 'Guardar cambios'
                      : 'Publicar producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
