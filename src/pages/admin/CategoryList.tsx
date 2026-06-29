import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { Tag, Pencil, Trash2, Plus, Check, X, Eye, EyeOff, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getPaginaContenido } from '../../lib/paginasApi';
import { mergeHomeContent } from '../../content/home';
import type { Category } from '../../types/product';

interface EditForm { nombre: string; visible: boolean; }
interface CreateForm { nombre: string; }

export default function CategoryList() {
  const { categories, loading, saving, error, createCategory, updateCategory, deleteCategory, reorderCategories } = useAdminCategories();
  const { products } = useAdminProducts();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: '', visible: true });
  const [editError, setEditError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Borrado bloqueado: la categoría está en uso (productos o escaparate de portada).
  const [blockedDelete, setBlockedDelete] = useState<{ id: string; message: string } | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ nombre: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement | null>(null);

  // ── Reordenar (movido aquí desde la antigua "Portada") ─────────────────────
  const [localCats, setLocalCats] = useState<Category[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const orderChangedRef = useRef(false);

  // Slugs de categoría usados en escaparates de la portada (para bloquear borrado).
  const [escaparateSlugs, setEscaparateSlugs] = useState<Set<string>>(new Set());

  // Sincroniza la lista local salvo durante un reordenado en curso.
  useEffect(() => {
    if (!orderChangedRef.current) setLocalCats(categories);
  }, [categories]);

  // Carga qué categorías usan los escaparates de la portada.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getPaginaContenido('inicio').then(({ data }) => {
      if (!active) return;
      const content = mergeHomeContent((data as Parameters<typeof mergeHomeContent>[0]) ?? null);
      const slugs = new Set(
        content.escaparates
          .filter(e => e.fuente === 'categoria' && e.categoria)
          .map(e => e.categoria as string),
      );
      setEscaparateSlugs(slugs);
    });
    return () => { active = false; };
  }, []);

  const createName = createForm.nombre.trim();
  const canSubmitCreate = !saving && createName.length > 0;

  useEffect(() => {
    if (!isCreateOpen) return;
    createInputRef.current?.focus();
  }, [isCreateOpen]);

  // ── Uso de una categoría (productos + escaparates) ─────────────────────────
  function categoryUsageMessage(cat: Category): string | null {
    const productCount = products.filter(p => (p.categories ?? []).includes(cat.nombre)).length;
    const inEscaparate = escaparateSlugs.has(cat.slug);
    if (productCount === 0 && !inEscaparate) return null;

    const parts: string[] = [];
    if (productCount > 0) parts.push(`la usan ${productCount} producto${productCount === 1 ? '' : 's'}`);
    if (inEscaparate) parts.push('se usa en un escaparate de la portada');
    return `No puedes eliminar «${cat.nombre}»: ${parts.join(' y ')}. Reasigna esos productos o quita el escaparate primero.`;
  }

  function startEdit(cat: Category) {
    setIsCreateOpen(false);
    setCreateError(null);
    setPendingDelete(null);
    setDeleteError(null);
    setBlockedDelete(null);
    setEditError(null);
    setEditingId(cat.id);
    setEditForm({ nombre: cat.nombre, visible: cat.visible });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(id: string) {
    setEditError(null);
    try {
      const err = await updateCategory(id, {
        nombre: editForm.nombre.trim(),
        visible: editForm.visible,
      });
      if (err) setEditError(err);
      else setEditingId(null);
    } catch {
      setEditError('Error inesperado al guardar. Inténtalo de nuevo.');
    }
  }

  function startDelete(cat: Category) {
    setIsCreateOpen(false);
    setCreateError(null);
    setEditingId(null);
    setEditError(null);
    setDeleteError(null);

    const blockMsg = categoryUsageMessage(cat);
    if (blockMsg) {
      setPendingDelete(null);
      setBlockedDelete({ id: cat.id, message: blockMsg });
    } else {
      setBlockedDelete(null);
      setPendingDelete(cat.id);
    }
  }

  async function handleDeleteConfirm(id: string) {
    setDeleteError(null);
    try {
      const err = await deleteCategory(id);
      if (err) setDeleteError(err);
      else setPendingDelete(null);
    } catch {
      setDeleteError('Error inesperado al eliminar. Inténtalo de nuevo.');
    }
  }

  async function handleToggleVisible(cat: Category) {
    try {
      await updateCategory(cat.id, { visible: !cat.visible });
    } catch {
      // toggle no tiene UI de error dedicada; el usuario puede reintentar
    }
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateError(null);
    const nombre = createName;
    if (!nombre) return;
    try {
      const err = await createCategory(nombre);
      if (err) setCreateError(err);
      else {
        setCreateForm({ nombre: '' });
        setIsCreateOpen(false);
      }
    } catch {
      setCreateError('Error inesperado al crear la categoría. Inténtalo de nuevo.');
    }
  }

  function openCreatePanel() {
    setEditingId(null);
    setPendingDelete(null);
    setBlockedDelete(null);
    setEditError(null);
    setDeleteError(null);
    setCreateError(null);
    setCreateForm({ nombre: '' });
    setIsCreateOpen(true);
  }

  function closeCreatePanel() {
    setCreateError(null);
    setCreateForm({ nombre: '' });
    setIsCreateOpen(false);
  }

  function handleCreateNameChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.currentTarget.value;
    setCreateForm(prev => ({ ...prev, nombre: value }));
  }

  // ── Reordenar ──────────────────────────────────────────────────────────────
  function moveUp(index: number) {
    if (index === 0) return;
    orderChangedRef.current = true;
    setOrderChanged(true);
    setLocalCats(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === localCats.length - 1) return;
    orderChangedRef.current = true;
    setOrderChanged(true);
    setLocalCats(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function discardOrder() {
    orderChangedRef.current = false;
    setOrderChanged(false);
    setOrderError(null);
    setLocalCats(categories);
  }

  async function handleSaveOrder() {
    setOrderSaving(true);
    setOrderError(null);
    const err = await reorderCategories(localCats.map(c => c.id));
    setOrderSaving(false);
    if (err) {
      setOrderError(err);
    } else {
      orderChangedRef.current = false;
      setOrderChanged(false);
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2500);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="admin-list-header"><h1>Categorías</h1></div>
        <p className="admin-loading-text">Cargando categorías…</p>
      </div>
    );
  }

  const canReorder = isSupabaseConfigured && editingId === null && pendingDelete === null && blockedDelete === null;

  return (
    <div>
      <div className="admin-list-header">
        <h1>Categorías</h1>
      </div>

      <p className="admin-home-section-desc" style={{ marginBottom: '1.25rem' }}>
        El orden y la visibilidad de las categorías se reflejan en el catálogo, el menú y los escaparates de la portada.
      </p>

      {/* Aviso modo sin Supabase */}
      {!isSupabaseConfigured && (
        <p className="login-warning" style={{ marginBottom: '1rem' }}>
          Modo local: las categorías son de solo lectura. Conecta Supabase para crear, editar o eliminar.
        </p>
      )}

      {!createError && error && <p className="admin-form-error">{error}</p>}

      {isSupabaseConfigured && (
        <div className="admin-cat-create">
          {!isCreateOpen && (
            <button
              type="button"
              className="admin-cat-create-trigger"
              onClick={openCreatePanel}
              disabled={saving}
            >
              <Plus size={18} />
              Nueva categoría
            </button>
          )}

          {isCreateOpen && (
            <form onSubmit={handleCreate} className="admin-cat-create-panel">
              <div className="admin-cat-create-head">
                <div>
                  <h2>Nueva categoría</h2>
                  <p>Escribe el nombre y se guardará al final de la lista.</p>
                </div>
                <button
                  type="button"
                  className="admin-icon-btn"
                  onClick={closeCreatePanel}
                  aria-label="Cerrar formulario de nueva categoría"
                  disabled={saving}
                >
                  <X size={16} />
                </button>
              </div>

              <input
                ref={createInputRef}
                type="text"
                value={createForm.nombre}
                onChange={handleCreateNameChange}
                placeholder="Nombre de la categoría"
                required
                disabled={saving}
                className="admin-cat-create-input"
              />

              {createError && <p className="admin-form-error admin-cat-create-error">{createError}</p>}

              <div className="admin-cat-create-actions">
                <button type="submit" className="admin-cat-add-btn admin-cat-add-btn--wide" disabled={!canSubmitCreate}>
                  <Plus size={16} />
                  Añadir categoría
                </button>
                <button
                  type="button"
                  className="admin-cat-create-cancel"
                  onClick={closeCreatePanel}
                  disabled={saving}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Barra de guardar orden */}
      {orderChanged && (
        <div className="admin-home-actions" style={{ marginTop: '1rem' }}>
          {orderSaved && (
            <span className="admin-home-saved"><Check size={14} /> Orden guardado</span>
          )}
          {orderError && <p className="admin-form-error" style={{ margin: 0 }}>{orderError}</p>}
          <button className="admin-home-save-btn" onClick={handleSaveOrder} disabled={orderSaving || saving}>
            {orderSaving ? 'Guardando…' : 'Guardar orden'}
          </button>
          <button className="admin-home-discard-btn" onClick={discardOrder} disabled={orderSaving}>
            Descartar
          </button>
        </div>
      )}

      {localCats.length === 0 && (
        <div className="admin-empty" style={{ marginTop: '1rem' }}>
          <div className="admin-empty-icon"><Tag size={40} /></div>
          <p>
            {isSupabaseConfigured
              ? 'Todavía no hay categorías. Crea la primera desde el botón de arriba.'
              : 'No hay categorías todavía. Conecta Supabase para empezar a gestionarlas.'}
          </p>
        </div>
      )}

      <div className="admin-product-cards" style={{ marginTop: '1rem' }}>
        {localCats.map((cat, i) => {
          // ── Modo edición ───────────────────────────────────────────────
          if (editingId === cat.id) {
            return (
              <div key={cat.id}>
                <div className="admin-product-card admin-cat-editing">
                  <div className="admin-cat-icon"><Tag size={18} /></div>
                  <input
                    type="text"
                    value={editForm.nombre}
                    onChange={e => { const v = e.currentTarget.value; setEditForm(p => ({ ...p, nombre: v })); }}
                    className="admin-cat-edit-nombre"
                    disabled={saving}
                    autoFocus
                  />
                  <label className="admin-cat-visible-label">
                    <input
                      type="checkbox"
                      checked={editForm.visible}
                      onChange={e => { const v = e.currentTarget.checked; setEditForm(p => ({ ...p, visible: v })); }}
                      disabled={saving}
                    />
                    <span>Visible</span>
                  </label>
                  <div className="admin-product-actions">
                    <button
                      className="admin-icon-btn admin-icon-btn--success"
                      onClick={() => handleSaveEdit(cat.id)}
                      aria-label="Guardar cambios"
                      disabled={saving || !editForm.nombre.trim()}
                    >
                      {saving ? '…' : <Check size={16} />}
                    </button>
                    <button
                      className="admin-icon-btn"
                      onClick={cancelEdit}
                      aria-label="Cancelar edición"
                      disabled={saving}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {editError && <p className="admin-form-error admin-cat-inline-error">{editError}</p>}
              </div>
            );
          }

          // ── Borrado bloqueado (en uso) ─────────────────────────────────
          if (blockedDelete?.id === cat.id) {
            return (
              <div key={cat.id} className="admin-product-card admin-product-card--confirm">
                <div className="admin-cat-icon"><AlertCircle size={18} /></div>
                <div className="admin-delete-confirm">
                  <span className="admin-delete-error">{blockedDelete.message}</span>
                  <button className="admin-delete-no" onClick={() => setBlockedDelete(null)}>
                    Entendido
                  </button>
                </div>
              </div>
            );
          }

          // ── Modo confirmación de borrado ───────────────────────────────
          if (pendingDelete === cat.id) {
            return (
              <div key={cat.id} className="admin-product-card admin-product-card--confirm">
                <div className="admin-cat-icon"><Tag size={18} /></div>
                <div className="admin-delete-confirm">
                  {deleteError
                    ? <span className="admin-delete-error">{deleteError}</span>
                    : <span className="admin-delete-question">¿Eliminar "{cat.nombre}"?</span>
                  }
                  <button
                    className="admin-delete-no"
                    onClick={() => { setPendingDelete(null); setDeleteError(null); }}
                    disabled={saving}
                  >
                    {deleteError ? 'Entendido' : 'No'}
                  </button>
                  {!deleteError && (
                    <button
                      className="admin-delete-yes"
                      onClick={() => handleDeleteConfirm(cat.id)}
                      disabled={saving}
                    >
                      {saving ? '…' : 'Sí'}
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // ── Vista normal ───────────────────────────────────────────────
          return (
            <div key={cat.id} className="admin-product-card">
              {canReorder && (
                <div className="admin-cat-reorder-arrows">
                  <button
                    className="admin-cat-reorder-arrow"
                    onClick={() => moveUp(i)}
                    disabled={i === 0 || saving || orderSaving}
                    aria-label={`Subir ${cat.nombre}`}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="admin-cat-reorder-arrow"
                    onClick={() => moveDown(i)}
                    disabled={i === localCats.length - 1 || saving || orderSaving}
                    aria-label={`Bajar ${cat.nombre}`}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}

              <div className="admin-cat-icon"><Tag size={18} /></div>
              <div className="admin-product-info">
                <div className="admin-product-name">{cat.nombre}</div>
                <div className="admin-product-meta">
                  <span className={cat.visible ? 'admin-cat-status-visible' : 'admin-cat-status-hidden'}>
                    {cat.visible ? 'Visible' : 'Oculta'}
                  </span>
                </div>
              </div>
              <div className="admin-product-actions">
                {isSupabaseConfigured && (
                  <>
                    <button
                      className="admin-icon-btn"
                      onClick={() => handleToggleVisible(cat)}
                      aria-label={cat.visible ? `Ocultar ${cat.nombre}` : `Mostrar ${cat.nombre}`}
                      title={cat.visible ? 'Ocultar en tienda' : 'Mostrar en tienda'}
                      disabled={saving}
                    >
                      {cat.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      className="admin-icon-btn"
                      onClick={() => startEdit(cat)}
                      aria-label={`Editar ${cat.nombre}`}
                      disabled={saving}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="admin-icon-btn admin-icon-btn--danger"
                      onClick={() => startDelete(cat)}
                      aria-label={`Eliminar ${cat.nombre}`}
                      disabled={saving}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
