import { useState, useEffect, useRef } from 'react';
import type { Product } from '../types/product';
import type { DbProductoRow } from '../types/db';
import { useProductContext } from '../context/ProductContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mapProductRow } from '../lib/productsApi';

// Orden maestro de categorías (igual que ProductContext)
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

export interface UseProductsResult {
  products: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
}

// Caché a nivel de módulo: al volver atrás, la tienda tiene datos al instante
// (sin "Cargando…"), lo que permite restaurar el scroll correctamente.
let cachedProducts: Product[] | null = null;
let cachedCategories: string[] | null = null;

export function useProducts(): UseProductsResult {
  const ctx = useProductContext();

  // Ref para acceder a ctx dentro del efecto Supabase sin añadirlo como dep
  const ctxRef = useRef(ctx);
  useEffect(() => { ctxRef.current = ctx; });

  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [categories, setCategories] = useState<string[]>(cachedCategories ?? []);
  // loading solo si Supabase está configurado y aún no hay datos cacheados
  const [loading, setLoading] = useState(isSupabaseConfigured && cachedProducts === null);
  const [error, setError] = useState<string | null>(null);

  // ── Ruta fallback: sincroniza con localStorage cuando Supabase no está configurado ──
  useEffect(() => {
    if (isSupabaseConfigured) return;
    setProducts(ctx.products);
    setCategories(ctx.categories);
  }, [ctx.products, ctx.categories]);

  // ── Ruta Supabase: fetch único al montar ──────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      const { data, error: err } = await supabase!
        .from('productos')
        .select(`
          id, titulo, slug, descripcion, precio, stock, visible, destacado, nuevo, created_at,
          novedad_hasta, novedad_fija,
          categorias!categoria_id ( nombre ),
          producto_categorias ( categorias ( nombre ) ),
          imagenes_producto ( url, path, orden )
        `)
        .eq('visible', true)
        .order('orden');

      if (cancelled) return;

      if (err) {
        setError(err.message);
        // Fallback a localStorage en caso de error de red
        setProducts(ctxRef.current.products);
        setCategories(ctxRef.current.categories);
      } else {
        const rows = (data as DbProductoRow[] | null) ?? [];
        const mapped = rows.map(mapProductRow);
        const cats = buildCategories(mapped);
        cachedProducts = mapped;
        cachedCategories = cats;
        setProducts(mapped);
        setCategories(cats);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { products, categories, loading, error };
}
