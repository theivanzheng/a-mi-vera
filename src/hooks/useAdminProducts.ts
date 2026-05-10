import { useState, useEffect, useRef } from 'react';
import type { Product, ProductFormData } from '../types/product';
import { useProductContext } from '../context/ProductContext';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getAdminProducts,
  createProduct as apiCreate,
  updateProduct as apiUpdate,
  deleteProduct as apiDelete,
} from '../lib/productsApi';

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

export interface UseAdminProductsResult {
  products: Product[];
  categories: string[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  addProduct: (formData: ProductFormData) => Promise<string | null>;
  updateProduct: (id: string, formData: ProductFormData) => Promise<string | null>;
  deleteProduct: (id: string) => Promise<string | null>;
}

export function useAdminProducts(): UseAdminProductsResult {
  const ctx = useProductContext();
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const [sbProducts, setSbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function addProduct(formData: ProductFormData): Promise<string | null> {
    if (!isSupabaseConfigured) {
      ctxRef.current.addProduct(formData);
      return null;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await apiCreate(formData);
    if (!err) await refresh();
    else setError(err);
    setSaving(false);
    return err ?? null;
  }

  async function updateProduct(id: string, formData: ProductFormData): Promise<string | null> {
    if (!isSupabaseConfigured) {
      ctxRef.current.updateProduct(id, formData);
      return null;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await apiUpdate(id, formData);
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
    const { error: err } = await apiDelete(id);
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
    addProduct,
    updateProduct,
    deleteProduct,
  };
}
