import { supabase } from './supabase';
import type { DbBloqueHome } from '../types/db';

export interface HeroData {
  id: string | null;
  titulo: string;
  subtitulo: string;
  pill_texto: string;
  cta_texto: string;
}

export const HERO_DEFAULTS: Omit<HeroData, 'id'> = {
  titulo:     'Regalos que dejan huella esta temporada',
  subtitulo:  'Detalles personalizados para toda ocasión. Originales y únicos en cada entrega.',
  pill_texto: 'NUEVA COLECCIÓN',
  cta_texto:  'Ver el catálogo',
};

export async function getHeroBloque(): Promise<{ data: HeroData | null; error: string | null }> {
  const { data, error } = await supabase!
    .from('bloques_home')
    .select('id, titulo, subtitulo, pill_texto, cta_texto')
    .eq('tipo', 'hero')
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  const row = data as DbBloqueHome;
  return {
    data: {
      id:         row.id,
      titulo:     row.titulo     ?? HERO_DEFAULTS.titulo,
      subtitulo:  row.subtitulo  ?? HERO_DEFAULTS.subtitulo,
      pill_texto: row.pill_texto ?? HERO_DEFAULTS.pill_texto,
      cta_texto:  row.cta_texto  ?? HERO_DEFAULTS.cta_texto,
    },
    error: null,
  };
}

export async function upsertHeroBloque(
  hero: HeroData,
): Promise<{ id: string | null; error: string | null }> {
  const payload = {
    tipo:       'hero' as const,
    titulo:     hero.titulo,
    subtitulo:  hero.subtitulo,
    pill_texto: hero.pill_texto,
    cta_texto:  hero.cta_texto,
    visible:    true,
    orden:      0,
  };

  if (hero.id) {
    const { error } = await supabase!.from('bloques_home').update(payload).eq('id', hero.id);
    return { id: hero.id, error: error?.message ?? null };
  }

  const { data, error } = await supabase!
    .from('bloques_home')
    .insert(payload)
    .select('id')
    .single();

  const newId = (data as { id: string } | null)?.id ?? null;
  return { id: newId, error: error?.message ?? null };
}
