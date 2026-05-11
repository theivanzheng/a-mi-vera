import { useState, FormEvent } from 'react';
import { Tag, Pencil, Trash2, Plus, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Category } from '../../types/product';

interface EditForm { nombre: string; orden: string; visible: boolean; }
interface CreateForm { nombre: string; orden: string; }

export default function CategoryList() {
  const { categories, loading, saving, createCategory, updateCategory, deleteCategory } = useAdminCategories();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ nombre: '', orden: '', visible: true });
  const [editError, setEditError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateForm>({ nombre: '', orden: '' });
  const [createError, setCreateError] = useState<string | null>(null);

  function startEdit(cat: Category) {
    setPendingDelete(null);
    setDeleteError(null);
    setEditError(null);
    setEditingId(cat.id);
    setEditForm({ nombre: cat.nombre, orden: String(cat.orden), visible: cat.visible });
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
        orden: parseInt(editForm.orden) || 0,
        visible: editForm.visible,
      });
      if (err) setEditError(err);
      else setEditingId(null);
    } catch {
      setEditError('Error inesperado al guardar. Inténtalo de nuevo.');
    }
  }

  function startDelete(id: string) {
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
    const nombre = createForm.nombre.trim();
    if (!nombre) return;
    const orden = parseInt(createForm.orden) || 0;
    try {
      const err = await createCategory(nombre, orden);
      if (err) setCreateError(err);
      else setCreateForm({ nombre: '', orden: '' });
    } catch {
      setCreateError('Error inesperado al crear la categoría. Inténtalo de nuevo.');
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

      {/* Formulario de nueva categoría — solo si Supabase está configurado */}
      {isSupabaseConfigured && (
        <form onSubmit={handleCreate} className="admin-cat-new-form">
          <input
            type="text"
            value={createForm.nombre}
            onChange={e => { const v = e.currentTarget.value; setCreateForm(p => ({ ...p, nombre: v })); }}
            placeholder="Nombre de la categoría"
            required
            disabled={saving}
          />
          <input
            type="number"
            value={createForm.orden}
            onChange={e => { const v = e.currentTarget.value; setCreateForm(p => ({ ...p, orden: v })); }}
            placeholder="Orden"
            min="0"
            disabled={saving}
          />
          <button type="submit" className="admin-cat-add-btn" disabled={saving || !createForm.nombre.trim()}>
            <Plus size={16} />
            Añadir
          </button>
        </form>
      )}

      {createError && <p className="admin-form-error">{createError}</p>}

      {categories.length === 0 && (
        <div className="admin-empty" style={{ marginTop: '1rem' }}>
          <div className="admin-empty-icon"><Tag size={40} /></div>
          <p>No hay categorías todavía. Crea la primera con el formulario de arriba.</p>
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
                  <input
                    type="number"
                    value={editForm.orden}
                    onChange={e => { const v = e.currentTarget.value; setEditForm(p => ({ ...p, orden: v })); }}
                    className="admin-cat-edit-orden"
                    placeholder="Orden"
                    min="0"
                    disabled={saving}
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
                  Orden: {cat.orden}
                  {' · '}
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
