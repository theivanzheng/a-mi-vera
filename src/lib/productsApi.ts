import { supabase } from './supabase';
import { toSlug } from './slug';
import type { Product, ProductFormData } from '../types/product';
import type { DbProductoRow } from '../types/db';

const PRODUCT_SELECT = `
  id, titulo, slug, descripcion, precio,
  categorias ( nombre ),
  imagenes_producto ( url, path, orden )
`;

// Compartido con useProducts (lectura pública)
export function mapProductRow(row: DbProductoRow): Product {
  const images = [...(row.imagenes_producto ?? [])]
    .sort((a, b) => a.orden - b.orden)
    .map(img => img.url ?? img.path ?? '')
    .filter((url): url is string => url.length > 0);

  return {
    id: row.id,
    slug: row.slug,
    title: row.titulo,
    price: Number(row.precio),
    category: row.categorias?.nombre ?? '',
    description: row.descripcion ?? '',
    images: images.length > 0 ? images : ['https://via.placeholder.com/600?text=Sin+Imagen'],
  };
}

// Convierte errores de Supabase/Postgres en mensajes comprensibles en español
function translateDbError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('duplicate key') && msg.includes('slug')) {
    return 'Ya existe un producto con un título muy similar. Añade un matiz al nombre para diferenciarlo.';
  }
  if (msg.includes('violates row-level security') || msg.includes('new row violates')) {
    return 'Sin permisos para realizar esta acción. Tu sesión puede haber expirado — vuelve a iniciar sesión.';
  }
  if (msg.includes('jwt expired') || msg.includes('invalid jwt') || msg.includes('not authenticated')) {
    return 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
  }
  if (msg.includes('check constraint') || msg.includes('chk_imagen_origen')) {
    return 'Cada imagen necesita una URL válida.';
  }
  return message;
}

async function resolveCategoriaId(nombre: string): Promise<string | null> {
  const { data } = await supabase!
    .from('categorias')
    .select('id')
    .eq('nombre', nombre)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// Admin: lee todos los productos (sin filtro visible)
export async function getAdminProducts(): Promise<{ data: Product[]; error: string | null }> {
  const { data, error } = await supabase!
    .from('productos')
    .select(PRODUCT_SELECT)
    .order('orden');

  if (error) return { data: [], error: translateDbError(error.message) };
  const rows = (data as DbProductoRow[] | null) ?? [];
  return { data: rows.map(mapProductRow), error: null };
}

export async function createProduct(formData: ProductFormData): Promise<{ error: string | null }> {
  const slug = toSlug(formData.title);
  const precio = parseFloat(formData.price);
  const categoria_id = formData.category
    ? await resolveCategoriaId(formData.category)
    : null;

  const { data: prod, error: prodErr } = await supabase!
    .from('productos')
    .insert({ slug, titulo: formData.title, descripcion: formData.description || null, precio, categoria_id, visible: true })
    .select('id')
    .single();

  if (prodErr) return { error: translateDbError(prodErr.message) };

  const images = [formData.image1, formData.image2, formData.image3, formData.image4]
    .filter(url => url.trim().length > 0);

  if (images.length > 0) {
    const { error: imgErr } = await supabase!
      .from('imagenes_producto')
      .insert(images.map((url, i) => ({ producto_id: (prod as { id: string }).id, url, orden: i + 1 })));
    if (imgErr) return { error: translateDbError(imgErr.message) };
  }

  return { error: null };
}

export async function updateProduct(id: string, formData: ProductFormData): Promise<{ error: string | null }> {
  const slug = toSlug(formData.title);
  const precio = parseFloat(formData.price);
  const categoria_id = formData.category
    ? await resolveCategoriaId(formData.category)
    : null;

  const { error: prodErr } = await supabase!
    .from('productos')
    .update({ slug, titulo: formData.title, descripcion: formData.description || null, precio, categoria_id })
    .eq('id', id);

  if (prodErr) return { error: translateDbError(prodErr.message) };

  // Reemplazar imágenes: borrar las anteriores e insertar las nuevas.
  // Si el DELETE falla, el producto quedaría con datos inconsistentes → abortar.
  const { error: delErr } = await supabase!.from('imagenes_producto').delete().eq('producto_id', id);
  if (delErr) return { error: translateDbError(delErr.message) };

  const images = [formData.image1, formData.image2, formData.image3, formData.image4]
    .filter(url => url.trim().length > 0);

  if (images.length > 0) {
    const { error: imgErr } = await supabase!
      .from('imagenes_producto')
      .insert(images.map((url, i) => ({ producto_id: id, url, orden: i + 1 })));
    if (imgErr) return { error: translateDbError(imgErr.message) };
  }

  return { error: null };
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase!.from('productos').delete().eq('id', id);
  if (error) return { error: translateDbError(error.message) };
  return { error: null };
}
