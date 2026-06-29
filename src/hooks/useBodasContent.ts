import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { getPaginaContenido } from '../lib/paginasApi';
import { BODAS_DEFAULTS, mergeBodasContent, type BodasContent } from '../content/bodas';

/**
 * Devuelve el contenido de la página "bodas".
 * Arranca con los valores por defecto y, si Supabase tiene contenido guardado,
 * lo aplica encima al cargar. Mismo patrón que useHomeContent / useNosotrosContent.
 */
export function useBodasContent(): { content: BodasContent; loading: boolean; hasStored: boolean } {
  const [content, setContent] = useState<BodasContent>(BODAS_DEFAULTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [hasStored, setHasStored] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getPaginaContenido('bodas').then(({ data }) => {
      if (!active) return;
      if (data) {
        setContent(mergeBodasContent(data as Partial<BodasContent>));
        setHasStored(true);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { content, loading, hasStored };
}
