import { useState, useEffect } from 'react';
import { getHeroBloque, HERO_DEFAULTS, type HeroData } from '../lib/bloqueHomeApi';
import { isSupabaseConfigured } from '../lib/supabase';

export function useHeroBloque(): HeroData {
  const [hero, setHero] = useState<HeroData>({ id: null, ...HERO_DEFAULTS });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getHeroBloque().then(({ data }) => {
      if (data) setHero(data);
    });
  }, []);

  return hero;
}
