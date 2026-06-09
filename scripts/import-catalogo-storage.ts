/**
 * Importador Fase 7B — catálogo real a Supabase DEV con fotos a Storage.
 *
 * Lee:  import/catalogo-final.json  (generado por scripts/build-catalogo-final.py)
 * Sube: las fotos de "Fotos Productos/" al bucket imagenes-productos
 * Crea: categorías + productos + imagenes_producto (path) + producto_categorias
 *
 * Uso:
 *   npm run import:catalogo -- --dry-run     # plan, no escribe nada
 *   npm run import:catalogo -- --reset       # BORRA productos+categorías y reimporta
 *   npm run import:catalogo                   # importa sin borrar (añade)
 *
 * Requiere en .env.local:
 *   VITE_SUPABASE_URL=https://<proyecto-dev>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...   (sin prefijo VITE_)
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const FOTOS_DIR = 'Fotos Productos';
const CATALOGO = 'import/catalogo-final.json';
const BUCKET = 'imagenes-productos';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface CatalogoProducto {
  id: number;
  title: string;
  slug: string;
  price: number;
  description: string;
  categories: string[];
  photos: string[];
}

// ── Flags ──────────────────────────────────────────────────────────────────
const isDryRun = process.argv.includes('--dry-run');
const isReset = process.argv.includes('--reset');

// ── Helpers ──────────────────────────────────────────────────────────────────
const COMBINING = /[̀-ͯ]/g;

function toSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(COMBINING, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-');
}

function safeName(filename: string): string {
  const noExt = filename.replace(/\.[^.]+$/, '');
  return noExt.toLowerCase().normalize('NFD').replace(COMBINING, '')
    .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    .slice(0, 40) || 'imagen';
}

function storagePath(productId: string, slug: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uuid = randomUUID().replace(/-/g, '').slice(0, 8);
  const folder = `${(slug.slice(0, 30) || 'producto')}-${productId.slice(0, 8)}`;
  return `productos/${folder}/${uuid}_${safeName(filename)}.${ext}`;
}

function resolveSlug(base: string, used: Set<string>): string {
  let slug = base;
  let n = 2;
  while (used.has(slug)) { slug = `${base}-${n}`; n++; }
  used.add(slug);
  return slug;
}

async function getOrCreateCategory(
  sb: SupabaseClient, nombre: string, cache: Map<string, string>, orden: number,
): Promise<string> {
  const cached = cache.get(nombre);
  if (cached) return cached;
  const { data: existing } = await sb.from('categorias').select('id').eq('nombre', nombre).maybeSingle();
  if (existing) {
    const id = (existing as { id: string }).id;
    cache.set(nombre, id);
    return id;
  }
  const { data: created, error } = await sb.from('categorias')
    .insert({ nombre, slug: toSlug(nombre), visible: true, orden })
    .select('id').single();
  if (error || !created) throw new Error(`No se pudo crear categoría "${nombre}": ${error?.message}`);
  const id = (created as { id: string }).id;
  cache.set(nombre, id);
  console.log(`   + Categoría creada: "${nombre}"`);
  return id;
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
const supabaseUrl = process.env['VITE_SUPABASE_URL']?.trim() ?? '';
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim() ?? '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const catalogo = JSON.parse(readFileSync(resolve(process.cwd(), CATALOGO), 'utf-8')) as CatalogoProducto[];

// Orden fijo de las categorías reales (para el campo orden al crearlas)
const ORDEN_CATEGORIAS = [
  'Detalles con magia', 'Regalos con foto', 'Pasión por la madera', 'Pasión por el vino',
  'Maestros cerveceros', 'Especial primera comunión', 'Regalos únicos', 'Nuestros peques',
  'Somos de cava', 'Vivan los novios',
];
const ordenDe = (nombre: string) => {
  const i = ORDEN_CATEGORIAS.indexOf(nombre);
  return (i === -1 ? ORDEN_CATEGORIAS.length : i) * 10;
};

console.log(`\n${'─'.repeat(60)}`);
console.log(`Importador catálogo Fase 7B — Supabase DEV${isDryRun ? ' [DRY RUN]' : ''}${isReset ? ' [RESET]' : ''}`);
console.log(`${'─'.repeat(60)}`);
console.log(`Productos: ${catalogo.length}  ·  URL: ${supabaseUrl}\n`);

// Validar que todas las fotos existen en disco
const fotosEnDisco = new Set(readdirSync(FOTOS_DIR));
const fotosFaltan: string[] = [];
for (const p of catalogo) {
  for (const f of p.photos) if (!fotosEnDisco.has(f)) fotosFaltan.push(`[${p.id}] ${f}`);
}
if (fotosFaltan.length > 0) {
  console.error('❌  Faltan fotos en disco:');
  fotosFaltan.forEach(f => console.error('   ', f));
  process.exit(1);
}

const totalFotos = catalogo.reduce((n, p) => n + p.photos.length, 0);
console.log(`✅  ${totalFotos} fotos localizadas en "${FOTOS_DIR}".`);

if (isDryRun) {
  console.log('\n── DRY RUN: no se escribirá nada ──\n');
  for (const p of catalogo) {
    console.log(`   [${p.id}] "${p.title}" → ${p.slug} · ${p.price}€ · ${p.categories.join(' + ')} · ${p.photos.length} foto(s)`);
  }
  if (isReset) console.log('\n⚠  Con --reset (sin --dry-run) se BORRARÍAN todos los productos y categorías actuales primero.');
  console.log('\nDry-run completado. Quita --dry-run para ejecutar.\n');
  process.exit(0);
}

const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Reset opcional ───────────────────────────────────────────────────────────
if (isReset) {
  console.log('🗑  RESET: borrando productos y categorías actuales...');
  // Borrar productos (CASCADE limpia imagenes_producto y producto_categorias)
  const { error: delProd } = await sb.from('productos').delete().not('id', 'is', null);
  if (delProd) { console.error('   Error borrando productos:', delProd.message); process.exit(1); }
  const { error: delCat } = await sb.from('categorias').delete().not('id', 'is', null);
  if (delCat) { console.error('   Error borrando categorías:', delCat.message); process.exit(1); }
  console.log('   Productos y categorías borrados.\n');
}

// ── Importación ──────────────────────────────────────────────────────────────
const categoryCache = new Map<string, string>();
const usedSlugs = new Set<string>();

// Cargar slugs existentes (si no hubo reset)
const { data: existingSlugs } = await sb.from('productos').select('slug');
((existingSlugs as { slug: string }[] | null) ?? []).forEach(r => usedSlugs.add(r.slug));

let created = 0;
let failed = 0;

console.log('Importando...\n');

for (let i = 0; i < catalogo.length; i++) {
  const p = catalogo[i] as CatalogoProducto;
  const slug = resolveSlug(p.slug, usedSlugs);
  process.stdout.write(`   [${i + 1}/${catalogo.length}] "${p.title}" (${p.photos.length} foto/s)... `);

  try {
    const productId = randomUUID();

    // 1. Categorías
    const categoriaIds: string[] = [];
    for (const nombre of p.categories) {
      categoriaIds.push(await getOrCreateCategory(sb, nombre, categoryCache, ordenDe(nombre)));
    }

    // 2. Subir fotos a Storage
    const uploadedPaths: string[] = [];
    for (const filename of p.photos) {
      const bytes = readFileSync(join(FOTOS_DIR, filename));
      const path = storagePath(productId, slug, filename);
      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, {
        contentType: 'image/jpeg', upsert: false,
      });
      if (upErr) throw new Error(`subida "${filename}": ${upErr.message}`);
      uploadedPaths.push(path);
    }

    // 3. Insertar producto
    const { error: prodErr } = await sb.from('productos').insert({
      id: productId,
      titulo: p.title,
      slug,
      descripcion: p.description || null,
      precio: p.price,
      categoria_id: categoriaIds[0] ?? null,
      stock: 0,
      visible: true,
      orden: (i + 1) * 10,
    });
    if (prodErr) throw new Error(`producto: ${prodErr.message}`);

    // 4. Imágenes (path de Storage)
    const { error: imgErr } = await sb.from('imagenes_producto').insert(
      uploadedPaths.map((path, idx) => ({ producto_id: productId, path, url: null, orden: idx + 1 })),
    );
    if (imgErr) throw new Error(`imágenes: ${imgErr.message}`);

    // 5. Enlaces N:N de categorías
    const { error: catErr } = await sb.from('producto_categorias').insert(
      categoriaIds.map(cid => ({ producto_id: productId, categoria_id: cid })),
    );
    if (catErr) throw new Error(`categorías N:N: ${catErr.message}`);

    console.log('OK');
    created++;
  } catch (ex) {
    const msg = ex instanceof Error ? ex.message : String(ex);
    console.error(`ERROR\n      ${msg}`);
    failed++;
  }
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`✅  Creados : ${created}`);
if (failed > 0) console.log(`❌  Fallidos: ${failed}`);
console.log('');
process.exit(failed > 0 ? 1 : 0);
