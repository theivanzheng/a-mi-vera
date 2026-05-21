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
  type ImageEntry,
  type ProductTextFields,
  type ProductPatch,
  type ProgressFn,
} from '../lib/productsApi';

// Re-exportar para que ProductForm pueda importarlos desde el hook
export type { ImageEntry, ProductTextFields, ProductPatch, ProgressFn };

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
    ...fields,
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
  };
}
