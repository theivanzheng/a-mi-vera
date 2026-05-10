// Tipos de administración — listos para conectar con Supabase en Fase 5

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
}

export interface StockRecord {
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface HomeSection {
  id: string;
  type: 'hero' | 'banner' | 'featured';
  title: string;
  subtitle?: string;
  image_url?: string;
  active: boolean;
  sort_order: number;
}
