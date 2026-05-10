import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseUrl = typeof rawUrl === 'string' ? rawUrl.trim() : '';
const supabaseKey = typeof rawKey === 'string' ? rawKey.trim() : '';

// true solo si ambas variables están presentes y no vacías en .env.local / Vercel
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseKey.length > 0;

// null cuando las variables no están configuradas → los hooks usan el fallback localStorage
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
