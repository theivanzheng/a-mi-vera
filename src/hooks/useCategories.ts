import { useProducts } from './useProducts';

// Fase 5D: devuelve categorías desde Supabase (via useProducts) o localStorage (fallback).
// La UI no cambia respecto a Fase 4.
export function useCategories() {
  const { categories, loading, error } = useProducts();
  return { categories, loading, error };
}
