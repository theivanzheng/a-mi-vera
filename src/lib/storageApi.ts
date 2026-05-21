import { supabase } from './supabase';

const BUCKET = 'imagenes-productos';

export const DEBUG_STORAGE = false;

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const MAX_IMAGE_PX = 1600;
const JPEG_QUALITY = 0.85;

// Redimensiona una imagen al máximo de MAX_IMAGE_PX en el lado mayor.
// Devuelve el File original si ya es suficientemente pequeño o si algo falla.
// Salida: JPEG (compatible en todos los navegadores para canvas.toBlob).
export function resizeImage(file: File, maxPx = MAX_IMAGE_PX): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const srcUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(srcUrl);
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      if (w === 0 || h === 0 || (w <= maxPx && h <= maxPx)) {
        resolve(file);
        return;
      }

      const scale = Math.min(maxPx / w, maxPx / h);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const base = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${base}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(srcUrl);
      resolve(file);
    };

    img.src = srcUrl;
  });
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Solo se aceptan imágenes JPG, PNG o WEBP.';
  }
  if (file.size > MAX_SIZE) {
    return `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 5 MB.`;
  }
  return null;
}

function safeName(filename: string): string {
  const noExt = filename.replace(/\.[^.]+$/, '');
  return noExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'imagen';
}

// productSlug se usa para construir un nombre de carpeta legible.
// Formato: productos/{slug}-{shortProductId}/{uuid}_{safe_filename}.{ext}
// Ejemplo: productos/copa-vino-personalizada-a1b2c3d4/ab12cd34_copa.jpg
export async function uploadImage(
  productId: string,
  productSlug: string,
  file: File,
): Promise<{ path: string | null; error: string | null }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  const safe = safeName(file.name);
  const shortId = productId.slice(0, 8);
  const slugPart = (productSlug.slice(0, 30) || 'producto');
  const folder = `${slugPart}-${shortId}`;
  const path = `productos/${folder}/${uuid}_${safe}.${ext}`;

  if (DEBUG_STORAGE) {
    console.log('[LOG 1] uploadImage — file.name original:', file.name);
    console.log('[LOG 2] uploadImage — filename sanitizado:', `${uuid}_${safe}.${ext}`);
    console.log('[LOG 3] uploadImage — fullPath usado en upload():', path);
    console.log('[LOG 3] uploadImage — bucket:', BUCKET);
  }

  const { error } = await supabase!.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    if (DEBUG_STORAGE) console.error('[uploadImage] ERROR:', error.message);
    return { path: null, error: translateStorageError(error.message) };
  }

  if (DEBUG_STORAGE) console.log('[LOG 4] uploadImage — path DEVUELTO por uploadImage():', path);
  return { path, error: null };
}

export function getPublicImageUrl(path: string): string {
  const { data } = supabase!.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Devuelve null si todo fue bien, o un mensaje de error en español si falla.
// No lanza — el llamador decide si bloquear o solo avisar.
export async function deleteStorageImages(paths: string[]): Promise<string | null> {
  if (paths.length === 0) {
    if (DEBUG_STORAGE) console.log('[Storage.remove] paths vacíos — sin archivos que borrar');
    return null;
  }

  if (DEBUG_STORAGE) {
    console.log('[LOG 8] Storage.remove — paths enviados a remove():', JSON.stringify(paths));
    console.log('[LOG 8] Storage.remove — bucket:', BUCKET);
  }

  const { data, error } = await supabase!.storage.from(BUCKET).remove(paths);

  if (DEBUG_STORAGE) {
    console.log('[LOG 9] Storage.remove — data:', JSON.stringify(data), '| isArray:', Array.isArray(data), '| length:', Array.isArray(data) ? data.length : 'N/A');
    console.log('[LOG 9] Storage.remove — error:', error ? error.message : null);
  }

  if (error) {
    console.warn('[Storage] remove() error:', error.message, paths);
    return translateStorageDeleteError(error.message);
  }

  // data vacío ([] o null) sin error = RLS bloqueó silenciosamente O path incorrecto
  const nothingDeleted = !data || !Array.isArray(data) || data.length === 0;

  if (nothingDeleted) {
    console.warn('[Storage.remove] ⚠ NINGÚN ARCHIVO BORRADO. data:', JSON.stringify(data));
    console.warn('[Storage.remove] ⚠ Causa probable: policy Storage DELETE no aplicada o path incorrecto.');

    // Listar el directorio para cada path y diagnosticar la causa exacta
    for (const p of paths) {
      const parts = p.split('/');
      const dir = parts.slice(0, -1).join('/');
      const filename = parts[parts.length - 1];

      console.log('──────────────────────────────────────────');
      console.log('[Storage.list] path completo bajo análisis:', p);
      console.log('[Storage.list] directorio a listar:', dir);
      console.log('[Storage.list] nombre de archivo buscado:', filename);

      const { data: files, error: listErr } = await supabase!.storage
        .from(BUCKET)
        .list(dir, { limit: 100 });

      if (listErr) {
        console.error('[Storage.list] ERROR al listar directorio:', listErr.message);
        continue;
      }

      const names = files?.map(f => f.name) ?? [];
      console.log('[Storage.list] archivos reales en carpeta:', JSON.stringify(names));

      if (!files || files.length === 0) {
        console.error('[Storage.list] DIAGNÓSTICO: CARPETA VACÍA O NO EXISTE.');
        console.error('[Storage.list]   → El directorio no existe en Storage.');
        console.error('[Storage.list]   → CAUSA: el productId del upload no coincide con el productId del delete.');
        console.error('[Storage.list]   path buscado:', p);
      } else if (names.some(n => n === filename)) {
        console.error('[Storage.list] DIAGNÓSTICO: ✗ ARCHIVO EXISTE EN STORAGE pero remove() no lo borró.');
        console.error('[Storage.list]   → CAUSA: policy DELETE de Storage ausente o incorrecta.');
        console.error('[Storage.list]   → SOLUCIÓN: Supabase Dashboard → Storage → Policies.');
        console.error('[Storage.list]   → Verificar que existe la policy "storage_imagenes_delete_admin" para DELETE.');
        console.error('[Storage.list]   → O ejecutar: ALTER POLICY ... / DROP + CREATE POLICY.');
      } else {
        console.error('[Storage.list] DIAGNÓSTICO: ✗ ARCHIVO NO ENCONTRADO con ese nombre exacto.');
        console.error('[Storage.list]   Nombre buscado :', filename);
        console.error('[Storage.list]   Nombres reales :', names.join(' | '));
        console.error('[Storage.list]   → CAUSA: PATH INCORRECTO — el archivo se subió con un nombre diferente.');
        console.error('[Storage.list]   → Compara con el [LOG 3] del upload para ver la diferencia.');
      }
      console.log('──────────────────────────────────────────');
    }

    return 'No se pudieron eliminar los archivos del almacenamiento. Revisa la consola para el diagnóstico exacto.';
  }

  return null;
}

function translateStorageDeleteError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('not authenticated') || msg.includes('row-level security') || msg.includes('security')) {
    return 'Sin permisos para eliminar archivos del almacenamiento. La sesión puede haber expirado.';
  }
  return `No se pudieron eliminar algunos archivos del almacenamiento: ${message}`;
}

function translateStorageError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('payload too large') || msg.includes('413') || msg.includes('size')) {
    return 'El archivo es demasiado grande. El límite es 5 MB.';
  }
  if (msg.includes('mime') || msg.includes('content-type') || msg.includes('invalid')) {
    return 'Tipo de archivo no permitido. Solo JPG, PNG o WEBP.';
  }
  if (msg.includes('not authenticated') || msg.includes('row-level security') || msg.includes('security')) {
    return 'Sin permisos para subir imágenes. Tu sesión puede haber expirado.';
  }
  return `Error al subir la imagen: ${message}`;
}
