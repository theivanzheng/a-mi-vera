import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import { Tag, Pencil, Trash2, Plus, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Category } from '../../types/product';

interface EditForm { nombre: string; visible: boolean; }
interface CreateForm { nombre: string; }

export default function CategoryList() {
  const { categories, loading, saving, error, createCategory, updateCategory, deleteCategory } = useAdminCategories();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: '', visible: true });
  const [editError, setEditError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ nombre: '' });
  const [createError, setCreateError] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement | null>(null);

  const createName = createForm.nombre.trim();
  const canSubmitCreate = !saving && createName.length > 0;

  useEffect(() => {
    if (!isCreateOpen) return;
    createInputRef.current?.focus();
  }, [isCreateOpen]);

  function startEdit(cat: Category) {
    setIsCreateOpen(false);
    setCreateError(null);
    setPendingDelete(null);
    setDeleteError(null);
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

  function startDelete(id: string) {
    setIsCreateOpen(false);
    setCreateError(null);
    setEditingId(null);
    setEditError(null);
    setDeleteError(null);
    setPendingDelete(id);
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

  if (loading) {
    return (
      <div>
        <div className="admin-list-header"><h1>Categorías</h1></div>
        <p className="admin-loading-text">Cargando categorías…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-list-header">
        <h1>Categorías</h1>
      </div>

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

      {categories.length === 0 && (
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
        {categories.map(cat => {
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
                      onClick={() => startDelete(cat.id)}
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
