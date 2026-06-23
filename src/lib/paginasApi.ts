import { supabase } from './supabase';

// Lee el contenido (JSONB) de una página por su slug ('inicio', 'nosotros'…).
// Devuelve null si no hay fila todavía → el hook usará los valores por defecto.
export async function getPaginaContenido(
  slug: string,
): Promise<{ data: unknown | null; error: string | null }> {
  const { data, error } = await supabase!
    .from('paginas')
    .select('contenido')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: (data as { contenido: unknown } | null)?.contenido ?? null, error: null };
}

// Inserta o actualiza el contenido de una página (upsert por slug).
export async function upsertPaginaContenido(
  slug: string,
  contenido: unknown,
): Promise<{ error: string | null }> {
  const { error } = await supabase!
    .from('paginas')
    .upsert({ slug, contenido }, { onConflict: 'slug' });

  return { error: error?.message ?? null };
}
