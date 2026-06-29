import { useState, useEffect, useRef } from 'react';
import type { Product, ProductFormData } from '../types/product';
import { useProductContext } from '../context/ProductContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getAdminProducts,
  createProduct as apiCreate,
  updateProduct as apiUpdate,
  deleteProduct as apiDelete,
  patchProductFields,
  setProductCategoria,
  bulkCreateHiddenProducts,
  type ImageEntry,
  type ProductTextFields,
  type ProductPatch,
  type ProgressFn,
  type CreatedDraft,
} from '../lib/productsApi';

// Re-exportar para que ProductForm / importador puedan importarlos desde el hook
export type { ImageEntry, ProductTextFields, ProductPatch, ProgressFn, CreatedDraft };

const MAESTRAS_CATEGORIAS: string[] = [
  'Todos',
  'Detalles con magia',
  'Regalos con foto',
  'Pasión por la madera',
  'Pasión por el vino',
  'Maestros cerveceros',
  'Especial primera comunión',
  'Regalos únicos',
  'Novedades',
  'Nuestros peques',
  'Somos de cava',
  'Vivan los novios',
];

function buildCategories(productList: Product[]): string[] {
  const used = new Set(productList.map(p => p.category));
  const result = [...MAESTRAS_CATEGORIAS];
  used.forEach(c => { if (!result.includes(c)) result.push(c); });
  return result;
}

// Convierte campos + entradas de imagen al formato que espera ProductContext (fallback sin Supabase)
function toFallbackFormData(fields: ProductTextFields, images: ImageEntry[]): ProductFormData {
  const getUrl = (e: ImageEntry | undefined) =>
    e?.kind === 'url' ? e.url : '';
  return {
    title: fields.title,
    price: fields.price,
    category: fields.categories[0] ?? '', // fallback local: una sola categoría
    description: fields.description,
    image1: getUrl(images[0]),
    image2: getUrl(images[1]),
    image3: getUrl(images[2]),
    image4: getUrl(images[3]),
  };
}

export interface UseAdminProductsResult {
  products: Product[];
  categories: string[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  // Aviso no fatal: el producto se eliminó pero algunos archivos de Storage no pudieron borrarse
  storageWarning: string | null;
  addProduct: (fields: ProductTextFields, images: ImageEntry[], onProgress?: ProgressFn) => Promise<string | null>;
  updateProduct: (id: string, fields: ProductTextFields, images: ImageEntry[], oldStoragePaths: string[], onProgress?: ProgressFn) => Promise<string | null>;
  deleteProduct: (id: string) => Promise<string | null>;
  patchProduct: (id: string, patch: ProductPatch) => Promise<string | null>;
  // Edición masiva (varios productos a la vez, un solo refresh al final)
  bulkPatch: (ids: string[], patch: ProductPatch) => Promise<string | null>;
  bulkSetCategory: (ids: string[], categoryName: string) => Promise<string | null>;
  bulkDelete: (ids: string[]) => Promise<string | null>;
  // Importación masiva (Excel): crea varios productos y refresca una vez al final.
  importProducts: (items: { fields: ProductTextFields; images: ImageEntry[] }[]) => Promise<{ ok: number; errors: string[] }>;
  // Crea de golpe productos OCULTOS (solo texto) para la rejilla de fotos.
  bulkCreateHidden: (items: ProductTextFields[]) => Promise<{ created: CreatedDraft[]; error: string | null }>;
}

export function useAdminProducts(): UseAdminProductsResult {
  const ctx = useProductContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const [sbProducts, setSbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getAdminProducts().then(({ data, error: err }) => {
      if (err) setError(err);
      else setSbProducts(data);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    const { data, error: err } = await getAdminProducts();
    if (err) setError(err);
    else { setSbProducts(data); setError(null); }
  }

  async function addProduct(
    fields: ProductTextFields,
    images: ImageEntry[],
    onProgress?: ProgressFn,
  ): Promise<string | null> {
    if (!isSupabaseConfigured) {
      ctxRef.current.addProduct(toFallbackFormData(fields, images));
      return null;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await apiCreate(fields, images, onProgress);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  async function updateProduct(
    id: string,
    fields: ProductTextFields,
    images: ImageEntry[],
    oldStoragePaths: string[],
    onProgress?: ProgressFn,
  ): Promise<string | null> {
    if (!isSupabaseConfigured) {
      ctxRef.current.updateProduct(id, toFallbackFormData(fields, images));
      return null;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await apiUpdate(id, fields, images, oldStoragePaths, onProgress);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  async function deleteProduct(id: string): Promise<string | null> {
    if (!isSupabaseConfigured) {
      ctxRef.current.deleteProduct(id);
      return null;
    }
    setSaving(true);
    setError(null);
    setStorageWarning(null);

    // Extraer paths de Storage desde los datos ya cargados (mismo origen que usa updateProduct
    // con oldStoragePaths — evita un SELECT independiente que puede retornar vacío por RLS)
    const product = sbProducts.find(p => p.id === id);
    const storagePaths = (product?.imagePaths ?? []).filter((p): p is string => p !== null);

    const { error: err, storageWarning: sw } = await apiDelete(id, storagePaths);
    if (!err) {
      await refresh();
      if (sw) setStorageWarning(sw);
    } else {
      setError(err);
    }
    setSaving(false);
    return err ?? null;
  }

  async function patchProduct(id: string, patch: ProductPatch): Promise<string | null> {
    if (!isSupabaseConfigured) return null;
    setSaving(true);
    setError(null);
    const { error: err } = await patchProductFields(id, patch);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  // ── Edición masiva ──────────────────────────────────────────────────────────
  // Aplican la operación a cada id en secuencia y hacen UN solo refresh al final.
  async function bulkPatch(ids: string[], patch: ProductPatch): Promise<string | null> {
    if (!isSupabaseConfigured || ids.length === 0) return null;
    setSaving(true);
    setError(null);
    let firstErr: string | null = null;
    for (const id of ids) {
      const { error: err } = await patchProductFields(id, patch);
      if (err && !firstErr) firstErr = err;
    }
    await refresh();
    if (firstErr) setError(firstErr);
    setSaving(false);
    return firstErr;
  }

  async function bulkSetCategory(ids: string[], categoryName: string): Promise<string | null> {
    if (!isSupabaseConfigured || ids.length === 0) return null;
    setSaving(true);
    setError(null);
    let firstErr: string | null = null;
    for (const id of ids) {
      const { error: err } = await setProductCategoria(id, categoryName);
      if (err && !firstErr) firstErr = err;
    }
    await refresh();
    if (firstErr) setError(firstErr);
    setSaving(false);
    return firstErr;
  }

  async function bulkDelete(ids: string[]): Promise<string | null> {
    if (!isSupabaseConfigured || ids.length === 0) return null;
    setSaving(true);
    setError(null);
    setStorageWarning(null);
    let firstErr: string | null = null;
    let anyStorageWarn = false;
    for (const id of ids) {
      const product = sbProducts.find(p => p.id === id);
      const storagePaths = (product?.imagePaths ?? []).filter((p): p is string => p !== null);
      const { error: err, storageWarning: sw } = await apiDelete(id, storagePaths);
      if (err && !firstErr) firstErr = err;
      if (sw) anyStorageWarn = true;
    }
    await refresh();
    if (firstErr) setError(firstErr);
    if (anyStorageWarn) {
      setStorageWarning('Algunos productos se eliminaron, pero ciertas imágenes no pudieron borrarse del almacenamiento.');
    }
    setSaving(false);
    return firstErr;
  }

  async function importProducts(
    items: { fields: ProductTextFields; images: ImageEntry[] }[],
  ): Promise<{ ok: number; errors: string[] }> {
    if (!isSupabaseConfigured || items.length === 0) return { ok: 0, errors: [] };
    setSaving(true);
    setError(null);
    let ok = 0;
    const errors: string[] = [];
    for (const it of items) {
      const { error: err } = await apiCreate(it.fields, it.images);
      if (err) errors.push(`«${it.fields.title}»: ${err}`);
      else ok++;
    }
    await refresh();
    setSaving(false);
    return { ok, errors };
  }

  async function bulkCreateHidden(items: ProductTextFields[]): Promise<{ created: CreatedDraft[]; error: string | null }> {
    if (!isSupabaseConfigured) return { created: [], error: 'Conecta Supabase para importar.' };
    setSaving(true);
    setError(null);
    const res = await bulkCreateHiddenProducts(items);
    if (res.error) setError(res.error);
    await refresh();
    setSaving(false);
    return res;
  }

  return {
    products: isSupabaseConfigured ? sbProducts : ctx.products,
    categories: isSupabaseConfigured ? buildCategories(sbProducts) : ctx.categories,
    loading: isSupabaseConfigured ? loading : false,
    saving,
    error,
    storageWarning,
    addProduct,
    updateProduct,
    deleteProduct,
    patchProduct,
    bulkPatch,
    bulkSetCategory,
    bulkDelete,
    importProducts,
    bulkCreateHidden,
  };
}
