import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPaginaContenido } from '../lib/paginasApi';
import { NOSOTROS_DEFAULTS, mergeNosotrosContent, type NosotrosContent } from '../content/nosotros';

/**
 * Devuelve el contenido de la página "nosotros".
 * Arranca con los valores por defecto (la web se ve idéntica al instante) y, si
 * Supabase tiene contenido guardado, lo aplica encima al cargar. Mismo patrón
 * que useHomeContent.
 */
export function useNosotrosContent(): { content: NosotrosContent; loading: boolean; hasStored: boolean } {
  const [content, setContent] = useState<NosotrosContent>(NOSOTROS_DEFAULTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getPaginaContenido('nosotros').then(({ data }) => {
      if (!active) return;
      if (data) {
        setContent(mergeNosotrosContent(data as Partial<NosotrosContent>));
        setHasStored(true);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { content, loading, hasStored };
}
