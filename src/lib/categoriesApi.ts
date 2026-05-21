import { supabase } from './supabase';
import { toSlug } from './slug';
import type { Category } from '../types/product';
import type { DbCategoriaRow } from '../types/db';

function mapCategoryRow(row: DbCategoriaRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    visible: row.visible,
    orden: row.orden,
  };
}

function translateCatError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('duplicate key') && msg.includes('slug')) {
    return 'Ya existe una categoría con ese nombre. Elige un nombre diferente.';
  }
  if (msg.includes('violates row-level security') || msg.includes('new row violates')) {
    return 'Sin permisos para realizar esta acción. Tu sesión puede haber expirado — vuelve a iniciar sesión.';
  }
  if (msg.includes('jwt expired') || msg.includes('invalid jwt') || msg.includes('not authenticated')) {
    return 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
  }
  return message;
}

export async function getAdminCategories(): Promise<{ data: Category[]; error: string | null }> {
  const { data, error } = await supabase!
    .from('categorias')
    .select('id, nombre, slug, visible, orden')
    .order('orden');

  if (error) return { data: [], error: translateCatError(error.message) };
  const rows = (data as DbCategoriaRow[] | null) ?? [];
  return { data: rows.map(mapCategoryRow), error: null };
}

export async function createCategory(nombre: string, orden: number): Promise<{ error: string | null }> {
  const slug = toSlug(nombre);

  const { error } = await supabase!
    .from('categorias')
    .insert({ nombre, slug, orden, visible: true });

  if (error) return { error: translateCatError(error.message) };
  return { error: null };
}

export async function updateCategory(
  id: string,
  fields: Partial<Pick<Category, 'nombre' | 'visible' | 'orden'>>,
): Promise<{ error: string | null }> {
  const updates: Record<string, unknown> = { ...fields };

  // Regenerar slug si cambia el nombre
  if (fields.nombre !== undefined) {
    updates.slug = toSlug(fields.nombre);
  }

  const { error } = await supabase!
    .from('categorias')
    .update(updates)
    .eq('id', id);

  if (error) return { error: translateCatError(error.message) };

  // Cascada: sincronizar visibilidad de productos cuando cambia la de la categoría
  if (fields.visible !== undefined) {
    const { error: prodErr } = await supabase!
      .from('productos')
      .update({ visible: fields.visible })
      .eq('categoria_id', id);

    if (prodErr) return { error: translateCatError(prodErr.message) };
  }

  return { error: null };
}

export async function deleteCategory(id: string): Promise<{ error: string | null }> {
  // Verificar si tiene productos asociados antes de borrar
  const { count, error: countErr } = await supabase!
    .from('productos')
    .select('id', { count: 'exact', head: true })
    .eq('categoria_id', id);

  if (countErr) return { error: translateCatError(countErr.message) };

  const n = count ?? 0;
  if (n > 0) {
    return {
      error: `Esta categoría tiene ${n} producto${n === 1 ? '' : 's'} asociado${n === 1 ? '' : 's'}. Reasígnalos a otra categoría antes de eliminarla.`,
    };
  }

  const { error } = await supabase!.from('categorias').delete().eq('id', id);
  if (error) return { error: translateCatError(error.message) };
  return { error: null };
}
