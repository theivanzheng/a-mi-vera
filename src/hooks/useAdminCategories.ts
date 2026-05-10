import { useState, useEffect, useRef } from 'react';
import type { Category } from '../types/product';
import { useProductContext } from '../context/ProductContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { toSlug } from '../lib/slug';
import {
  getAdminCategories,
  createCategory as apiCreate,
  updateCategory as apiUpdate,
  deleteCategory as apiDelete,
} from '../lib/categoriesApi';

export interface UseAdminCategoriesResult {
  categories: Category[];
  categoryNames: string[]; // solo nombres, para el selector de ProductForm
  loading: boolean;
  saving: boolean;
  error: string | null;
  createCategory: (nombre: string, orden: number) => Promise<string | null>;
  updateCategory: (id: string, fields: Partial<Pick<Category, 'nombre' | 'visible' | 'orden'>>) => Promise<string | null>;
  deleteCategory: (id: string) => Promise<string | null>;
}

export function useAdminCategories(): UseAdminCategoriesResult {
  const ctx = useProductContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const [sbCategories, setSbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getAdminCategories().then(({ data, error: err }) => {
      if (err) setError(err);
      else setSbCategories(data);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    const { data, error: err } = await getAdminCategories();
    if (err) setError(err);
    else { setSbCategories(data); setError(null); }
  }

  async function createCategory(nombre: string, orden: number): Promise<string | null> {
    if (!isSupabaseConfigured) return 'Conecta Supabase para gestionar categorías.';
    setSaving(true);
    setError(null);
    const { error: err } = await apiCreate(nombre, orden);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  async function updateCategory(
    id: string,
    fields: Partial<Pick<Category, 'nombre' | 'visible' | 'orden'>>,
  ): Promise<string | null> {
    if (!isSupabaseConfigured) return 'Conecta Supabase para gestionar categorías.';
    setSaving(true);
    setError(null);
    const { error: err } = await apiUpdate(id, fields);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  async function deleteCategory(id: string): Promise<string | null> {
    if (!isSupabaseConfigured) return 'Conecta Supabase para gestionar categorías.';
    setSaving(true);
    setError(null);
    const { error: err } = await apiDelete(id);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  if (!isSupabaseConfigured) {
    // Fallback: convierte string[] del contexto en Category[] para mantener la UI coherente
    const fallbackCategories: Category[] = ctxRef.current.categories
      .filter(c => c !== 'Todos')
      .map((nombre, i) => ({
        id: `local-${i}`,
        slug: toSlug(nombre),
        nombre,
        visible: true,
        orden: i * 10,
      }));

    return {
      categories: fallbackCategories,
      categoryNames: ctxRef.current.categories.filter(c => c !== 'Todos'),
      loading: false,
      saving: false,
      error: null,
      createCategory,
      updateCategory,
      deleteCategory,
    };
  }

  return {
    categories: sbCategories,
    categoryNames: sbCategories.map(c => c.nombre),
    loading,
    saving,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
