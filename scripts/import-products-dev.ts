/**
 * Importador de productos desde CSV a Supabase DEV.
 *
 * Uso:       npm run import:dev -- ruta/al/archivo.csv
 * Dry-run:   npm run import:dev -- ruta/al/archivo.csv --dry-run
 *
 * Requiere en .env.local:
 *   VITE_SUPABASE_URL=https://<proyecto>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * La service_role_key NO tiene prefijo VITE_ → nunca se incluye en el
 * bundle del navegador. Solo la leen estos scripts de Node.js.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Cargar .env.local antes de leer process.env
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// ── Tipos ──────────────────────────────────────────────────────────────────

interface CsvRow {
  titulo?: string;
  precio?: string;
  categoria?: string;
  descripcion?: string;
  stock?: string;
  visible?: string;
  destacado?: string;
  nuevo?: string;
  imagen_url_1?: string;
  imagen_url_2?: string;
  imagen_url_3?: string;
  imagen_url_4?: string;
  notas?: string;
}

interface RowError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  row: number;
  titulo: string;
  slug: string;
  status: 'ok' | 'error';
  message?: string;
}

// ── Helpers (autocontenidos, sin importar desde src/) ──────────────────────

const COMBINING_MARKS = /[̀-ͯ]/g;

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function parseBoolean(value: string | undefined): boolean | 'invalid' | null {
  if (!value || value.trim() === '') return null;
  const v = value.trim().toLowerCase();
  if (['true', 'sí', 'si', '1', 'yes'].includes(v)) return true;
  if (['false', 'no', '0'].includes(v)) return false;
  return 'invalid';
}

function parseBooleanSafe(value: string | undefined, defaultValue: boolean): boolean {
  const r = parseBoolean(value);
  if (r === null || r === 'invalid') return defaultValue;
  return r;
}

function validateRow(row: CsvRow, rowNum: number): RowError[] {
  const errors: RowError[] = [];

  if (!row.titulo?.trim()) {
    errors.push({ row: rowNum, field: 'titulo', message: 'Campo obligatorio vacío' });
  }

  const precioRaw = row.precio?.trim();
  if (!precioRaw) {
    errors.push({ row: rowNum, field: 'precio', message: 'Campo obligatorio vacío' });
  } else if (isNaN(parseFloat(precioRaw)) || parseFloat(precioRaw) < 0) {
    errors.push({ row: rowNum, field: 'precio', message: `"${precioRaw}" no es un número >= 0` });
  }

  if (!row.categoria?.trim()) {
    errors.push({ row: rowNum, field: 'categoria', message: 'Campo obligatorio vacío' });
  }

  const stockRaw = row.stock?.trim();
  if (stockRaw) {
    const s = parseInt(stockRaw, 10);
    if (isNaN(s) || s < 0 || String(s) !== stockRaw) {
      errors.push({ row: rowNum, field: 'stock', message: `"${stockRaw}" debe ser un entero >= 0` });
    }
  }

  for (const field of ['visible', 'destacado', 'nuevo'] as const) {
    if (parseBoolean(row[field]) === 'invalid') {
      errors.push({
        row: rowNum,
        field,
        message: `"${row[field]}" inválido. Acepta: true/false, sí/no, 1/0`,
      });
    }
  }

  for (const field of ['imagen_url_1', 'imagen_url_2', 'imagen_url_3', 'imagen_url_4'] as const) {
    const url = row[field]?.trim();
    if (url && !isValidUrl(url)) {
      errors.push({
        row: rowNum,
        field,
        message: `"${url}" no es una URL válida (debe empezar por http:// o https://)`,
      });
    }
  }

  return errors;
}

// ── Operaciones Supabase ───────────────────────────────────────────────────

async function getOrCreateCategory(
  sb: SupabaseClient,
  nombre: string,
  cache: Map<string, string>,
): Promise<string | null> {
  const cached = cache.get(nombre);
  if (cached) return cached;

  // Buscar por nombre (case-sensitive, como está en DB)
  const { data: existing } = await sb
    .from('categorias')
    .select('id')
    .eq('nombre', nombre)
    .maybeSingle();

  if (existing) {
    cache.set(nombre, (existing as { id: string }).id);
    return (existing as { id: string }).id;
  }

  // Crear nueva categoría
  const { data: created, error } = await sb
    .from('categorias')
    .insert({ nombre, slug: toSlug(nombre), visible: true, orden: 0 })
    .select('id')
    .single();

  if (error || !created) {
    console.error(`   Error creando categoría "${nombre}": ${error?.message ?? 'sin datos'}`);
    return null;
  }

  const id = (created as { id: string }).id;
  cache.set(nombre, id);
  console.log(`   + Categoría creada: "${nombre}"`);
  return id;
}

function resolveSlug(base: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(base)) {
    existingSlugs.add(base);
    return base;
  }
  let n = 2;
  while (existingSlugs.has(`${base}-${n}`)) n++;
  const resolved = `${base}-${n}`;
  existingSlugs.add(resolved);
  console.log(`   ⚠  Slug "${base}" ya existe → usando "${resolved}"`);
  return resolved;
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

const csvPath = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');

if (!csvPath) {
  console.error('Error: falta la ruta al archivo CSV.');
  console.error('Uso:       npm run import:dev -- ruta/al/archivo.csv');
  console.error('Dry-run:   npm run import:dev -- ruta/al/archivo.csv --dry-run');
  process.exit(1);
}

// Validar variables de entorno
const supabaseUrl = process.env['VITE_SUPABASE_URL']?.trim() ?? '';
const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim() ?? '';

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL no está definida en .env.local');
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está definida en .env.local');
  console.error('Añade la clave service_role de tu proyecto Supabase DEV en .env.local');
  console.error('(sin prefijo VITE_ → nunca se incluirá en el bundle del navegador)');
  process.exit(1);
}

// Leer y parsear CSV
const absolutePath = resolve(process.cwd(), csvPath);
let csvContent: string;

try {
  csvContent = readFileSync(absolutePath, 'utf-8');
} catch {
  console.error(`Error: no se pudo leer "${absolutePath}"`);
  process.exit(1);
}

const rows = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
}) as CsvRow[];

if (rows.length === 0) {
  console.error('El archivo CSV está vacío o solo contiene la cabecera.');
  process.exit(1);
}

// ── Validación previa ──────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Importador A Mi Vera — Supabase DEV${isDryRun ? ' [DRY RUN]' : ''}`);
console.log(`${'─'.repeat(60)}`);
console.log(`Archivo : ${csvPath}`);
console.log(`Filas   : ${rows.length}`);
console.log(`URL DEV : ${supabaseUrl}\n`);

const allErrors: RowError[] = [];
const slugsInFile = new Map<string, number>();

for (let i = 0; i < rows.length; i++) {
  const rowNum = i + 2;
  const row = rows[i] as CsvRow;
  allErrors.push(...validateRow(row, rowNum));

  if (row.titulo?.trim()) {
    const slug = toSlug(row.titulo.trim());
    if (!slugsInFile.has(slug)) slugsInFile.set(slug, rowNum);
    else allErrors.push({ row: rowNum, field: 'titulo', message: `Slug duplicado en el CSV: "${slug}" (ya en fila ${slugsInFile.get(slug)})` });
  }
}

if (allErrors.length > 0) {
  console.error('❌  El CSV tiene errores de validación. Corrígelos antes de importar:\n');
  for (const e of allErrors) {
    console.error(`   Fila ${e.row} · ${e.field}: ${e.message}`);
  }
  console.error(`\nTotal: ${allErrors.length} error(es). Ejecuta "npm run import:validate" para ver el reporte completo.\n`);
  process.exit(1);
}

console.log(`✅  Validación OK — ${rows.length} producto(s) listos para importar.\n`);

if (isDryRun) {
  console.log('── DRY RUN: no se escribirá nada en la base de datos ──\n');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as CsvRow;
    const slug = toSlug(row.titulo!.trim());
    const imageCount = (['imagen_url_1', 'imagen_url_2', 'imagen_url_3', 'imagen_url_4'] as const)
      .filter(f => row[f]?.trim()).length;
    console.log(`   [${i + 1}] "${row.titulo}" → slug: "${slug}" · cat: "${row.categoria}" · ${imageCount} imagen(es)`);
  }
  console.log('\nDry-run completado. Quita --dry-run para importar de verdad.\n');
  process.exit(0);
}

// ── Importación real ───────────────────────────────────────────────────────

const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Obtener max orden actual para insertar al final de la lista
const { data: maxOrdenData } = await sb
  .from('productos')
  .select('orden')
  .order('orden', { ascending: false })
  .limit(1)
  .maybeSingle();

const baseOrden = ((maxOrdenData as { orden: number } | null)?.orden ?? 0) + 1;

// Cargar slugs existentes en la DB para detectar conflictos
const { data: existingSlugsData } = await sb.from('productos').select('slug');
const existingSlugs = new Set<string>(
  ((existingSlugsData as { slug: string }[] | null) ?? []).map(r => r.slug),
);

// Cache de categorías nombre → id
const categoryCache = new Map<string, string>();

const results: ImportResult[] = [];
let created = 0;
let failed = 0;

console.log('Importando productos...\n');

for (let i = 0; i < rows.length; i++) {
  const row = rows[i] as CsvRow;
  const rowNum = i + 2;
  const titulo = row.titulo!.trim();
  const baseSlug = toSlug(titulo);
  const slug = resolveSlug(baseSlug, existingSlugs);

  process.stdout.write(`   [${i + 1}/${rows.length}] "${titulo}"... `);

  // Resolver categoría
  const categoriaId = await getOrCreateCategory(sb, row.categoria!.trim(), categoryCache);
  if (!categoriaId) {
    console.error('ERROR (categoría)');
    results.push({ row: rowNum, titulo, slug, status: 'error', message: 'No se pudo crear/encontrar la categoría' });
    failed++;
    continue;
  }

  // Insertar producto
  const productId = crypto.randomUUID();
  const { error: prodErr } = await sb.from('productos').insert({
    id: productId,
    titulo,
    slug,
    descripcion: row.descripcion?.trim() || null,
    precio: parseFloat(row.precio!.trim()),
    categoria_id: categoriaId,
    stock: row.stock?.trim() ? parseInt(row.stock.trim(), 10) : 0,
    visible: parseBooleanSafe(row.visible, true),
    destacado: parseBooleanSafe(row.destacado, false),
    nuevo: parseBooleanSafe(row.nuevo, false),
    orden: baseOrden + i,
  });

  if (prodErr) {
    console.error(`ERROR\n      ${prodErr.message}`);
    results.push({ row: rowNum, titulo, slug, status: 'error', message: prodErr.message });
    failed++;
    continue;
  }

  // Insertar imágenes (solo URL, sin Storage)
  const imageFields = ['imagen_url_1', 'imagen_url_2', 'imagen_url_3', 'imagen_url_4'] as const;
  const imageRows = imageFields
    .map((f, idx) => ({ url: row[f]?.trim() ?? '', orden: idx + 1 }))
    .filter(img => img.url.length > 0);

  if (imageRows.length > 0) {
    const { error: imgErr } = await sb.from('imagenes_producto').insert(
      imageRows.map(img => ({
        producto_id: productId,
        url: img.url,
        path: null,
        orden: img.orden,
      })),
    );

    if (imgErr) {
      // El producto ya se insertó; avisar pero no fallar
      console.error(`OK (producto creado, imágenes fallaron: ${imgErr.message})`);
      results.push({ row: rowNum, titulo, slug, status: 'ok', message: `Imágenes fallaron: ${imgErr.message}` });
      created++;
      continue;
    }
  }

  console.log(`OK${imageRows.length > 0 ? ` (${imageRows.length} imagen${imageRows.length > 1 ? 'es' : ''})` : ''}`);
  results.push({ row: rowNum, titulo, slug, status: 'ok' });
  created++;
}

// ── Resumen ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`Importación completada`);
console.log(`${'─'.repeat(60)}`);
console.log(`✅  Creados : ${created}`);
if (failed > 0) console.log(`❌  Fallidos: ${failed}`);

if (failed > 0) {
  console.log('\nProductos con error:');
  for (const r of results.filter(r => r.status === 'error')) {
    console.log(`   Fila ${r.row}: "${r.titulo}" — ${r.message}`);
  }
}

const warnings = results.filter(r => r.status === 'ok' && r.message);
if (warnings.length > 0) {
  console.log('\nAvisos:');
  for (const r of warnings) {
    console.log(`   "${r.titulo}": ${r.message}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
