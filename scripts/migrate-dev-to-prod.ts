/**
 * Migración de datos DEV → PROD (un solo uso).
 *
 * Copia las tablas y los archivos de Storage de DEV a PROD usando el
 * service_role de ambos proyectos (bypassa RLS). PROD debe tener el esquema
 * creado antes: ejecuta supabase/schema-prod.sql en el SQL Editor de PROD.
 *
 * Requiere en .env.local:
 *   # DEV (ya las tienes; sirven las VITE_*)
 *   VITE_SUPABASE_URL=https://<dev>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...           (service_role de DEV)
 *   # PROD (añádelas TEMPORALMENTE; bórralas al terminar)
 *   PROD_SUPABASE_URL=https://<prod>.supabase.co
 *   PROD_SERVICE_ROLE_KEY=eyJ...               (service_role de PROD)
 *
 * Uso:
 *   npm run migrate:prod            → DRY-RUN: solo cuenta, no escribe nada
 *   npm run migrate:prod -- --go    → ejecuta la copia de verdad
 *
 * Es idempotente: hace upsert (por id / clave), así que re-ejecutarlo no
 * duplica filas.
 */
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Normaliza la URL: acepta que pegues la de la Data API (con /rest/v1/) o con
// barra final; createClient necesita solo la URL base del proyecto.
function normUrl(u: string): string {
  return u.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

const DEV_URL = normUrl(process.env.DEV_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '');
const DEV_KEY = (process.env.DEV_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const PROD_URL = normUrl(process.env.PROD_SUPABASE_URL ?? '');
const PROD_KEY = (process.env.PROD_SERVICE_ROLE_KEY ?? '').trim();

const GO = process.argv.includes('--go');
const BUCKET = 'imagenes-productos';

// Orden de copia: respeta las claves foráneas.
const TABLES: { name: string; conflict: string }[] = [
  { name: 'categorias',          conflict: 'id' },
  { name: 'productos',           conflict: 'id' },
  { name: 'producto_categorias', conflict: 'producto_id,categoria_id' },
  { name: 'imagenes_producto',   conflict: 'id' },
  { name: 'bloques_home',        conflict: 'id' },
  { name: 'paginas',             conflict: 'slug' },
];

function die(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!DEV_URL || !DEV_KEY) die('Faltan credenciales de DEV (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) en .env.local.');
if (!PROD_URL || !PROD_KEY) die('Faltan credenciales de PROD (PROD_SUPABASE_URL / PROD_SERVICE_ROLE_KEY) en .env.local.');
if (DEV_URL === PROD_URL) die('DEV y PROD apuntan al mismo proyecto. Aborto por seguridad.');

const dev = createClient(DEV_URL, DEV_KEY, { auth: { persistSession: false } });
const prod = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });

const CHUNK = 500;

async function copyTables(): Promise<void> {
  console.log('\n── Tablas ──');
  for (const { name, conflict } of TABLES) {
    const { data, error } = await dev.from(name).select('*');
    if (error) { console.error(`  ✗ leer ${name}: ${error.message}`); continue; }
    const rows = data ?? [];
    console.log(`  • ${name}: ${rows.length} filas en DEV`);
    if (!GO || rows.length === 0) continue;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const batch = rows.slice(i, i + CHUNK);
      const { error: upErr } = await prod.from(name).upsert(batch, { onConflict: conflict });
      if (upErr) { console.error(`    ✗ escribir ${name}: ${upErr.message}`); break; }
    }
    console.log(`    ✓ ${name} copiada a PROD`);
  }
}

function contentTypeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'webm') return 'video/webm';
  return 'image/jpeg';
}

async function copyStorage(): Promise<void> {
  console.log('\n── Storage (archivos con path) ──');
  const { data, error } = await dev.from('imagenes_producto').select('path').not('path', 'is', null);
  if (error) { console.error(`  ✗ leer paths: ${error.message}`); return; }
  const paths = (data ?? []).map((r: { path: string | null }) => r.path).filter(Boolean) as string[];
  console.log(`  • ${paths.length} archivos referenciados en Storage`);
  if (!GO) return;

  let ok = 0, fail = 0;
  for (const path of paths) {
    const { data: file, error: dErr } = await dev.storage.from(BUCKET).download(path);
    if (dErr || !file) { console.error(`    ✗ descargar ${path}: ${dErr?.message ?? 'sin datos'}`); fail++; continue; }
    const { error: uErr } = await prod.storage.from(BUCKET).upload(path, file, { contentType: contentTypeFor(path), upsert: true });
    if (uErr) { console.error(`    ✗ subir ${path}: ${uErr.message}`); fail++; }
    else ok++;
  }
  console.log(`    ✓ ${ok} subidos · ${fail} fallos`);
}

(async () => {
  console.log(GO
    ? '🚀 MIGRACIÓN REAL DEV → PROD (escribe en producción)'
    : '🔍 DRY-RUN — solo cuenta, no escribe. Añade  -- --go  para ejecutar.');
  console.log(`   DEV : ${DEV_URL}`);
  console.log(`   PROD: ${PROD_URL}`);

  await copyTables();
  await copyStorage();

  console.log(GO ? '\n✅ Migración terminada.\n' : '\n(dry-run) Repite con  -- --go  cuando quieras ejecutarla.\n');
})();
