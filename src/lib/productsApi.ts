import { supabase } from './supabase';
import { toSlug } from './slug';
import type { Product } from '../types/product';
import type { DbProductoRow } from '../types/db';
import { uploadImage, getPublicImageUrl, deleteStorageImages, DEBUG_STORAGE } from './storageApi';

// ── Tipos de imagen para el CRUD admin ─────────────────────────────────────

export type ImageEntry =
  | { kind: 'file'; file: File }           // archivo nuevo a subir
  | { kind: 'storage_path'; path: string } // ruta de Storage existente (mantener)
  | { kind: 'url'; url: string };          // URL externa existente (compatibilidad)

export interface ProductTextFields {
  title: string;
  price: string;
  category: string;
  description: string;
}

// ── SELECT compartido ───────────────────────────────────────────────────────

const PRODUCT_SELECT = `
  id, titulo, slug, descripcion, precio,
  categorias ( nombre ),
  imagenes_producto ( url, path, orden )
`;

// ── Mapeo DB → UI ───────────────────────────────────────────────────────────

export function mapProductRow(row: DbProductoRow): Product {
  const sorted = [...(row.imagenes_producto ?? [])].sort((a, b) => a.orden - b.orden);

  const images: string[] = [];
  const imagePaths: (string | null)[] = [];

  for (const img of sorted) {
    if (img.path) {
      // Imagen en Storage: convertir path → URL pública
      images.push(getPublicImageUrl(img.path));
      imagePaths.push(img.path);
    } else if (img.url) {
      // URL externa (compatibilidad con datos anteriores a Fase 6)
      images.push(img.url);
      imagePaths.push(null);
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.titulo,
    price: Number(row.precio),
    category: row.categorias?.nombre ?? '',
    description: row.descripcion ?? '',
    images: images.length > 0 ? images : ['https://via.placeholder.com/600?text=Sin+Imagen'],
    imagePaths,
  };
}

// ── Traducción de errores DB ────────────────────────────────────────────────

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
    return 'Cada imagen necesita una URL o archivo válido.';
  }
  return message;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function resolveCategoriaId(nombre: string): Promise<string | null> {
  const { data } = await supabase!
    .from('categorias')
    .select('id')
    .eq('nombre', nombre)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// ── API pública ──────────────────────────────────────────────────────────────

export async function getAdminProducts(): Promise<{ data: Product[]; error: string | null }> {
  const { data, error } = await supabase!
    .from('productos')
    .select(PRODUCT_SELECT)
    .order('orden');

  if (error) return { data: [], error: translateDbError(error.message) };
  const rows = (data as DbProductoRow[] | null) ?? [];
  return { data: rows.map(mapProductRow), error: null };
}

export async function createProduct(
  fields: ProductTextFields,
  images: ImageEntry[],
): Promise<{ error: string | null }> {
  // Generar ID de producto en cliente para usarlo en la ruta de Storage
  const productId = crypto.randomUUID();
  const slug = toSlug(fields.title);
  const precio = parseFloat(fields.price);
  const categoria_id = fields.category ? await resolveCategoriaId(fields.category) : null;

  // 1. Subir archivos nuevos ANTES de tocar la DB
  const uploadedPaths: string[] = [];
  const resolvedImages: Array<{ path?: string; url?: string }> = [];

  for (const entry of images) {
    if (entry.kind === 'file') {
      const { path, error: uploadErr } = await uploadImage(productId, slug, entry.file);
      if (uploadErr || !path) {
        await deleteStorageImages(uploadedPaths);
        return { error: uploadErr ?? 'Error desconocido al subir la imagen.' };
      }
      uploadedPaths.push(path);
      resolvedImages.push({ path });
    } else if (entry.kind === 'storage_path') {
      resolvedImages.push({ path: entry.path });
    } else {
      resolvedImages.push({ url: entry.url });
    }
  }

  // 2. Insertar producto (con ID generado en cliente)
  const { error: prodErr } = await supabase!
    .from('productos')
    .insert({
      id: productId,
      slug,
      titulo: fields.title,
      descripcion: fields.description || null,
      precio,
      categoria_id,
      visible: true,
    });

  if (prodErr) {
    await deleteStorageImages(uploadedPaths);
    return { error: translateDbError(prodErr.message) };
  }

  // 3. Insertar filas de imágenes
  if (resolvedImages.length > 0) {
    if (DEBUG_STORAGE) {
      console.log('[LOG 5] createProduct — paths exactos que se insertarán en imagenes_producto.path:');
      resolvedImages.forEach((img, i) => {
        console.log(`  [imagen ${i + 1}] path="${img.path ?? null}" url="${img.url ?? null}"`);
      });
    }

    const { error: imgErr } = await supabase!
      .from('imagenes_producto')
      .insert(
        resolvedImages.map((img, i) => ({
          producto_id: productId,
          path: img.path ?? null,
          url: img.url ?? null,
          orden: i + 1,
        })),
      );

    if (imgErr) {
      // Limpieza: borrar producto (CASCADE limpia las filas de imagenes) y archivos subidos
      await supabase!.from('productos').delete().eq('id', productId);
      await deleteStorageImages(uploadedPaths);
      return { error: translateDbError(imgErr.message) };
    }
  }

  return { error: null };
}

export async function updateProduct(
  id: string,
  fields: ProductTextFields,
  images: ImageEntry[],
  oldStoragePaths: string[],
): Promise<{ error: string | null }> {
  const slug = toSlug(fields.title);
  const precio = parseFloat(fields.price);
  const categoria_id = fields.category ? await resolveCategoriaId(fields.category) : null;

  // 1. Subir archivos nuevos ANTES de tocar la DB
  const newlyUploadedPaths: string[] = [];
  const resolvedImages: Array<{ path?: string; url?: string }> = [];

  for (const entry of images) {
    if (entry.kind === 'file') {
      const { path, error: uploadErr } = await uploadImage(id, slug, entry.file);
      if (uploadErr || !path) {
        await deleteStorageImages(newlyUploadedPaths);
        return { error: uploadErr ?? 'Error desconocido al subir la imagen.' };
      }
      newlyUploadedPaths.push(path);
      resolvedImages.push({ path });
    } else if (entry.kind === 'storage_path') {
      resolvedImages.push({ path: entry.path });
    } else {
      resolvedImages.push({ url: entry.url });
    }
  }

  // 2. Actualizar campos de texto del producto
  const { error: prodErr } = await supabase!
    .from('productos')
    .update({
      slug,
      titulo: fields.title,
      descripcion: fields.description || null,
      precio,
      categoria_id,
    })
    .eq('id', id);

  if (prodErr) {
    await deleteStorageImages(newlyUploadedPaths);
    return { error: translateDbError(prodErr.message) };
  }

  // 3. Borrar filas antiguas de imágenes
  const { error: delErr } = await supabase!
    .from('imagenes_producto')
    .delete()
    .eq('producto_id', id);

  if (delErr) {
    await deleteStorageImages(newlyUploadedPaths);
    return { error: translateDbError(delErr.message) };
  }

  // 4. Insertar nuevas filas
  if (resolvedImages.length > 0) {
    if (DEBUG_STORAGE) {
      console.log('[LOG 5] updateProduct — paths exactos que se insertarán en imagenes_producto.path:');
      resolvedImages.forEach((img, i) => {
        console.log(`  [imagen ${i + 1}] path="${img.path ?? null}" url="${img.url ?? null}"`);
      });
    }

    const { error: imgErr } = await supabase!
      .from('imagenes_producto')
      .insert(
        resolvedImages.map((img, i) => ({
          producto_id: id,
          path: img.path ?? null,
          url: img.url ?? null,
          orden: i + 1,
        })),
      );

    if (imgErr) {
      await deleteStorageImages(newlyUploadedPaths);
      return { error: translateDbError(imgErr.message) };
    }
  }

  // 5. Éxito: borrar archivos de Storage que ya no se referencian
  const keptPaths = new Set(
    resolvedImages.filter(img => img.path).map(img => img.path!),
  );
  const pathsToDelete = oldStoragePaths.filter(p => !keptPaths.has(p));
  await deleteStorageImages(pathsToDelete);

  return { error: null };
}

export async function deleteProduct(
  id: string,
  fallbackPaths: string[], // paths pre-cargados desde sbProducts, usados si el SELECT retorna vacío
): Promise<{ error: string | null; storageWarning: string | null }> {

  // ── DIAGNÓSTICO: sesión auth ──────────────────────────────────────────────
  if (DEBUG_STORAGE) {
    const { data: sessionData } = await supabase!.auth.getSession();
    console.log('══════════════════════════════════════════');
    console.log('[LOG 6] deleteProduct — productId:', id);
    console.log('[LOG 6] deleteProduct — auth sesión activa:', !!sessionData.session,
      '| email:', sessionData.session?.user?.email ?? 'SIN SESIÓN');
    console.log('[LOG 6] deleteProduct — fallbackPaths (desde sbProducts.imagePaths):', JSON.stringify(fallbackPaths));
    console.log('══════════════════════════════════════════');
  }

  // ── PASO 1: SELECT paths ANTES de borrar el producto ─────────────────────
  const { data: imgData, error: selectErr } = await supabase!
    .from('imagenes_producto')
    .select('path')
    .eq('producto_id', id);

  if (DEBUG_STORAGE) {
    console.log('[LOG 7] deleteProduct — SELECT imagenes_producto.path:');
    console.log('   data raw:', JSON.stringify(imgData));
    console.log('   error:', selectErr?.message ?? null);
  }
  if (selectErr) {
    console.warn('[deleteProduct] SELECT falló:', selectErr.message);
  }

  const dbPaths = ((imgData as { path: string | null }[] | null) ?? [])
    .map(r => r.path)
    .filter((p): p is string => p !== null);

  // Fuente principal: paths del SELECT. Si vacíos, usar fallbackPaths de sbProducts.
  const pathsToDelete = dbPaths.length > 0 ? dbPaths : fallbackPaths;

  if (DEBUG_STORAGE) {
    console.log('[LOG 7] deleteProduct — paths extraídos del SELECT (no nulos):', JSON.stringify(dbPaths));
    console.log('[LOG 7] deleteProduct — fuente usada:', dbPaths.length > 0 ? 'SELECT DB' : 'fallbackPaths');
    console.log('[LOG 7] deleteProduct — pathsToDelete finales (→ estos van a remove()):', JSON.stringify(pathsToDelete));
    if (dbPaths.length === 0 && fallbackPaths.length > 0) {
      console.warn('[deleteProduct] ⚠ SELECT vacío — usando fallbackPaths');
    }
    if (pathsToDelete.length === 0) {
      console.warn('[deleteProduct] ⚠ pathsToDelete vacío — remove() no se llamará');
    }
  }

  // ── PASO 2: Borrar de Storage ANTES de borrar de DB ──────────────────────
  const storageErr = await deleteStorageImages(pathsToDelete);

  if (DEBUG_STORAGE) console.log('[deleteProduct] 4. deleteStorageImages:', storageErr ?? 'OK');

  // ── PASO 3: Borrar producto — CASCADE elimina imagenes_producto ───────────
  const { error } = await supabase!.from('productos').delete().eq('id', id);

  if (DEBUG_STORAGE) console.log('[deleteProduct] 5. DB delete producto:', error?.message ?? 'OK');

  if (error) return { error: translateDbError(error.message), storageWarning: null };

  const storageWarning = storageErr
    ? 'El producto se eliminó, pero algunas imágenes no pudieron borrarse del almacenamiento.'
    : null;

  return { error: null, storageWarning };
}
