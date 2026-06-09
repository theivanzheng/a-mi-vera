// Tipos de las filas que devuelve Supabase.
// Capa privada: solo la usan hooks y lib. La UI usa src/types/product.ts.

export interface DbImagenProducto {
  url: string | null;
  path: string | null;
  orden: number;
}

export interface DbCategoria {
  nombre: string;
}

// Fila de la tabla N:N producto_categorias con la categoría anidada
export interface DbProductoCategoria {
  categorias: DbCategoria | null;
}

// Shape exacta del SELECT en useProducts
export interface DbProductoRow {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  precio: string; // NUMERIC devuelve string en supabase-js
  stock: number;
  visible: boolean;
  destacado: boolean;
  nuevo: boolean;
  created_at: string;
  novedad_hasta: string | null; // fijado manual en Novedades con caducidad
  novedad_fija: boolean;         // fijado indefinido en Novedades
  categorias: DbCategoria | null; // FK antigua (transición) — categoría principal
  producto_categorias: DbProductoCategoria[]; // relación N:N (nueva fuente de verdad)
  imagenes_producto: DbImagenProducto[];
}

// Shape exacta del SELECT en bloqueHomeApi
export interface DbBloqueHome {
  id: string;
  tipo: 'hero' | 'banner' | 'featured';
  titulo: string | null;
  subtitulo: string | null;
  imagen_url: string | null;
  categoria_id: string | null;
  pill_texto: string | null;
  cta_texto: string | null;
  visible: boolean;
  orden: number;
}

// Shape exacta del SELECT en useAdminCategories
export interface DbCategoriaRow {
  id: string;
  nombre: string;
  slug: string;
  visible: boolean;
  orden: number;
}
