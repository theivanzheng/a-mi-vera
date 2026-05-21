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
  categorias: DbCategoria | null; // nullable porque categoria_id es nullable
  imagenes_producto: DbImagenProducto[];
}

// Shape exacta del SELECT en useAdminCategories
export interface DbCategoriaRow {
  id: string;
  nombre: string;
  slug: string;
  visible: boolean;
  orden: number;
}
