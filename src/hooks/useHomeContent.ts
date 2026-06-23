import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPaginaContenido } from '../lib/paginasApi';
import { HOME_DEFAULTS, mergeHomeContent, type HomeContent } from '../content/home';

/**
 * Devuelve el contenido de la portada.
 * Arranca con los valores por defecto (la web se ve idéntica al instante) y,
 * si Supabase tiene contenido guardado, lo aplica encima al cargar.
 */
export function useHomeContent(): { content: HomeContent; loading: boolean; hasStored: boolean } {
  const [content, setContent] = useState<HomeContent>(HOME_DEFAULTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getPaginaContenido('inicio').then(({ data }) => {
      if (!active) return;
      if (data) {
        setContent(mergeHomeContent(data as Partial<HomeContent>));
        setHasStored(true);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { content, loading, hasStored };
}
