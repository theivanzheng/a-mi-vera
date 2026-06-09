export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  category: string;        // categoría principal (= categories[0]) — compatibilidad
  categories: string[];    // todas las categorías (relación N:N)
  description: string;
  images: string[];
  // Novedades (opcional; presente desde Supabase). Ausente en fallback local.
  novedadHasta?: string | null; // ISO 8601 o null
  novedadFija?: boolean;
  // Rutas de Storage alineadas con images[] (null = URL externa). Opcional: ausente en el fallback local.
  imagePaths?: (string | null)[];
  // Campos opcionales: presentes cuando se carga desde Supabase, ausentes en el fallback localStorage.
  visible?: boolean;
  stock?: number;
  destacado?: boolean;
  nuevo?: boolean;
  createdAt?: string; // ISO 8601 — usado para ordenar por más reciente
}

export interface Category {
  id: string;
  slug: string;
  nombre: string;
  visible: boolean;
  orden: number;
}

// El formulario del admin mantiene price como string mientras se edita en el input
export interface ProductFormData {
  title: string;
  price: string;
  category: string;
  description: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}
