import { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Upload, X, Download } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import type { ImageEntry, ProductTextFields, ProgressFn } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { isSupabaseConfigured } from '../../lib/supabase';
import { validateImageFile, resizeImage } from '../../lib/storageApi';
import { parseProductsExcel, downloadProductsTemplate } from '../../lib/productImport';

// ── Tipos locales ──────────────────────────────────────────────────────────

interface TextFields {
  title: string;
  price: string;
  description: string;
  // Campos URL solo usados en el fallback (sin Supabase)
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}

// Opciones de duración del fijado manual en Novedades
type NovedadDuration = '7' | '15' | '30' | 'indef' | 'keep';
const NOVEDAD_OPTIONS: { value: Exclude<NovedadDuration, 'keep'>; label: string }[] = [
  { value: '7', label: '7 días' },
  { value: '15', label: '15 días' },
  { value: '30', label: '30 días' },
  { value: 'indef', label: 'Indefinido' },
];

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
  title: '', price: '', description: '',
  image1: '', image2: '', image3: '', image4: '',
};

// ── Componente ─────────────────────────────────────────────────────────────

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = id !== undefined;
  const navigate = useNavigate();

  const { products, loading: prodLoading, saving, addProduct, updateProduct, importProducts } = useAdminProducts();
  const { categoryNames, loading: catLoading } = useAdminCategories();
  const loading = prodLoading || catLoading;

  const [formData, setFormData] = useState<TextFields>(EMPTY_FORM);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [novedadEnabled, setNovedadEnabled] = useState(false);
  const [novedadDuration, setNovedadDuration] = useState<NovedadDuration>('30');
  // Valor original de Novedades al entrar en edición (para la opción "keep")
  const originalNovedadRef = useRef<{ fija: boolean; hasta: string | null }>({ fija: false, hasta: null });
  const [imageSlots, setImageSlots] = useState<[ImageSlot, ImageSlot, ImageSlot, ImageSlot]>([
    { ...EMPTY_SLOT }, { ...EMPTY_SLOT }, { ...EMPTY_SLOT }, { ...EMPTY_SLOT },
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savePhase, setSavePhase] = useState<'uploading' | 'saving' | null>(null);
  // Importación masiva desde Excel (solo modo "nuevo")
  const [importBusy, setImportBusy] = useState(false);
  const [importDragOver, setImportDragOver] = useState(false);
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [importDone, setImportDone] = useState<{ ok: number; total: number } | null>(null);
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
      description: product.description,
    }));

    setSelectedCats(product.categories ?? []);

    // Restaurar estado de Novedades
    const fija = product.novedadFija ?? false;
    const hasta = product.novedadHasta ?? null;
    originalNovedadRef.current = { fija, hasta };
    const pinned = fija || (hasta != null && new Date(hasta).getTime() > Date.now());
    setNovedadEnabled(pinned);
    // En edición, "keep" preserva el valor actual mientras no se elija otra duración
    setNovedadDuration(pinned ? 'keep' : '30');

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

  function toggleCategory(name: string) {
    setSelectedCats(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name],
    );
  }

  // Calcula los campos de Novedades a partir del estado del formulario
  function computeNovedad(): { novedadFija: boolean; novedadHasta: string | null } {
    if (!novedadEnabled) return { novedadFija: false, novedadHasta: null };
    if (novedadDuration === 'keep') {
      return {
        novedadFija: originalNovedadRef.current.fija,
        novedadHasta: originalNovedadRef.current.hasta,
      };
    }
    if (novedadDuration === 'indef') return { novedadFija: true, novedadHasta: null };
    const days = Number(novedadDuration);
    const hasta = new Date(Date.now() + days * 86_400_000).toISOString();
    return { novedadFija: false, novedadHasta: hasta };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (isSupabaseConfigured && selectedCats.length === 0) {
      setSubmitError('Selecciona al menos una categoría.');
      return;
    }

    const fields: ProductTextFields = {
      title: formData.title,
      price: formData.price,
      categories: selectedCats,
      description: formData.description,
      ...computeNovedad(),
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

  // Importación masiva desde un Excel arrastrado/seleccionado.
  async function handleImportFile(file: File) {
    setImportBusy(true);
    setImportNotes([]);
    setImportDone(null);
    setSubmitError(null);

    const knownCats = categoryNames.filter(c => c !== 'Todos' && c !== 'Novedades');
    const { items, notes, error } = await parseProductsExcel(file, knownCats);

    if (error) {
      setImportBusy(false);
      setImportNotes([error]);
      return;
    }
    if (items.length === 0) {
      setImportBusy(false);
      setImportNotes(['No se encontró ningún producto válido en el archivo.', ...notes]);
      return;
    }

    const { ok, errors } = await importProducts(items);
    setImportBusy(false);
    setImportDone({ ok, total: items.length });
    setImportNotes([...notes, ...errors]);
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
  // Novedades no es una categoría real; "Todos" es la vista global. Se excluyen del selector.
  const realCategoryNames = categoryNames.filter(c => c !== 'Todos' && c !== 'Novedades');

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

      {/* ── Importar varios desde Excel (solo al crear) ─── */}
      {!isEditing && isSupabaseConfigured && (
        <div className="admin-form-section admin-import-card">
          <span className="admin-form-section-title">Importar varios desde Excel</span>
          <p className="admin-field-hint" style={{ marginTop: 0 }}>
            Sube un Excel (.xlsx) con una fila por producto y se crearán todos de una vez.
          </p>

          <div
            className={`admin-import-drop${importDragOver ? ' is-over' : ''}${importBusy ? ' is-busy' : ''}`}
            onDragOver={e => { e.preventDefault(); if (!importBusy) setImportDragOver(true); }}
            onDragLeave={() => setImportDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setImportDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f && !importBusy) handleImportFile(f);
            }}
          >
            <Upload size={22} />
            {importBusy ? (
              <span>Importando productos…</span>
            ) : (
              <span>Arrastra aquí tu Excel o <label htmlFor="import-file" className="admin-import-browse">selecciónalo</label></span>
            )}
            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              disabled={importBusy}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleImportFile(f); }}
            />
          </div>

          <button type="button" className="admin-import-template-btn" onClick={() => downloadProductsTemplate()}>
            <Download size={14} /> Descargar plantilla de ejemplo
          </button>

          {importDone && (
            <p className="admin-import-result">
              ✓ {importDone.ok} de {importDone.total} producto{importDone.total === 1 ? '' : 's'} importado{importDone.ok === 1 ? '' : 's'}.
              {importDone.ok > 0 && (
                <button type="button" className="admin-import-see" onClick={() => navigate('/admin/productos')}>
                  Ver productos →
                </button>
              )}
            </p>
          )}

          {importNotes.length > 0 && (
            <ul className="admin-import-notes">
              {importNotes.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          )}
        </div>
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
            <label>Categorías</label>
            <div className="admin-cat-chips" role="group" aria-label="Categorías del producto">
              {realCategoryNames.map(c => {
                const on = selectedCats.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className={`admin-cat-chip${on ? ' admin-cat-chip--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleCategory(c)}
                    disabled={disabled}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <span className="admin-field-hint">
              Pulsa para añadir o quitar. Un producto puede estar en varias categorías.
            </span>
          </div>

          {isSupabaseConfigured && (
            <div className="admin-field">
              <label className="admin-novedad-toggle">
                <input
                  type="checkbox"
                  className="admin-novedad-checkbox"
                  checked={novedadEnabled}
                  onChange={e => setNovedadEnabled(e.currentTarget.checked)}
                  disabled={disabled}
                />
                <span className="admin-novedad-track" aria-hidden="true">
                  <span className="admin-novedad-thumb" />
                </span>
                <span className="admin-novedad-label">Mostrar en Novedades</span>
              </label>

              <div
                className={`admin-novedad-panel${novedadEnabled ? ' admin-novedad-panel--open' : ''}`}
                aria-hidden={!novedadEnabled}
              >
                <div className="admin-novedad-panel-inner">
                  <span className="admin-novedad-question">¿Durante cuánto tiempo?</span>
                  <div className="admin-novedad-segmented" role="group" aria-label="Duración en Novedades">
                    {novedadDuration === 'keep' && (
                      <button
                        type="button"
                        className="admin-seg admin-seg--on"
                        aria-pressed={true}
                        disabled={disabled}
                      >
                        Mantener actual
                      </button>
                    )}
                    {NOVEDAD_OPTIONS.map(opt => {
                      const on = novedadDuration === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          className={`admin-seg${on ? ' admin-seg--on' : ''}`}
                          aria-pressed={on}
                          onClick={() => setNovedadDuration(opt.value)}
                          disabled={disabled || (!novedadEnabled)}
                          tabIndex={novedadEnabled ? 0 : -1}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

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
