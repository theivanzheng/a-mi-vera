/**
 * Validación de CSV de importación de productos.
 *
 * Uso:  npm run import:validate -- ruta/al/archivo.csv
 * Salida: reporte en consola.
 * Código de salida: 0 = sin errores, 1 = hay errores.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface CsvRow {
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

export interface RowError {
  row: number;
  field: string;
  message: string;
}

// ── Helpers compartidos ────────────────────────────────────────────────────

const COMBINING_MARKS = /[̀-ͯ]/g;

export function toSlug(text: string): string {
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

export function parseBoolean(value: string | undefined): boolean | 'invalid' | null {
  if (!value || value.trim() === '') return null;
  const v = value.trim().toLowerCase();
  if (['true', 'sí', 'si', '1', 'yes'].includes(v)) return true;
  if (['false', 'no', '0'].includes(v)) return false;
  return 'invalid';
}

export function validateRow(row: CsvRow, rowNum: number): RowError[] {
  const errors: RowError[] = [];

  if (!row.titulo?.trim()) {
    errors.push({ row: rowNum, field: 'titulo', message: 'Campo obligatorio vacío' });
  }

  const precioRaw = row.precio?.trim();
  if (!precioRaw) {
    errors.push({ row: rowNum, field: 'precio', message: 'Campo obligatorio vacío' });
  } else {
    const p = parseFloat(precioRaw);
    if (isNaN(p) || p < 0) {
      errors.push({ row: rowNum, field: 'precio', message: `"${precioRaw}" no es un número >= 0` });
    }
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

// ── Main ───────────────────────────────────────────────────────────────────

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Error: falta la ruta al archivo CSV.');
  console.error('Uso: npm run import:validate -- ruta/al/archivo.csv');
  process.exit(1);
}

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
  bom: true, // soporta UTF-8 BOM generado por Excel
}) as CsvRow[];

if (rows.length === 0) {
  console.error('El archivo CSV está vacío o solo contiene la cabecera.');
  process.exit(1);
}

// Verificar cabeceras obligatorias
const headers = Object.keys(rows[0] ?? {});
const requiredHeaders = ['titulo', 'precio', 'categoria'] as const;
const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
if (missingHeaders.length > 0) {
  console.error(`Error: faltan columnas obligatorias en la cabecera: ${missingHeaders.join(', ')}`);
  console.error(`Columnas encontradas: ${headers.join(', ')}`);
  process.exit(1);
}

console.log(`\nValidando ${rows.length} fila(s) en "${csvPath}"...\n`);

const allErrors: RowError[] = [];
const slugsSeen = new Map<string, number>(); // slug → primera fila que lo genera
const slugDuplicates: Array<{ row: number; slug: string; firstRow: number }> = [];

for (let i = 0; i < rows.length; i++) {
  const rowNum = i + 2; // fila 1 = cabecera
  const row = rows[i] as CsvRow;

  allErrors.push(...validateRow(row, rowNum));

  if (row.titulo?.trim()) {
    const slug = toSlug(row.titulo.trim());
    const firstRow = slugsSeen.get(slug);
    if (firstRow !== undefined) {
      slugDuplicates.push({ row: rowNum, slug, firstRow });
    } else {
      slugsSeen.set(slug, rowNum);
    }
  }
}

// ── Reporte ────────────────────────────────────────────────────────────────

let hasErrors = false;

if (allErrors.length > 0) {
  hasErrors = true;
  console.error('❌  ERRORES DE VALIDACIÓN:\n');
  for (const e of allErrors) {
    console.error(`   Fila ${e.row} · ${e.field}: ${e.message}`);
  }
  console.error('');
}

if (slugDuplicates.length > 0) {
  hasErrors = true;
  console.error('❌  SLUGS DUPLICADOS DENTRO DEL CSV:\n');
  for (const d of slugDuplicates) {
    console.error(`   Fila ${d.row}: slug "${d.slug}" ya aparece en la fila ${d.firstRow}`);
  }
  console.error('   → Diferencia los títulos para evitar slugs idénticos.\n');
}

if (hasErrors) {
  const total = allErrors.length + slugDuplicates.length;
  console.error(`Resultado: ${total} problema(s) encontrado(s). Corrige el CSV antes de importar.\n`);
  process.exit(1);
}

const categories = [...new Set(rows.map(r => (r as CsvRow).categoria?.trim()).filter((c): c is string => Boolean(c)))];
console.log(`✅  ${rows.length} producto(s) válido(s).`);
console.log(`   Categorías detectadas (${categories.length}): ${categories.join(' · ')}`);
console.log(`   Slugs a generar: ${[...slugsSeen.keys()].slice(0, 5).join(', ')}${slugsSeen.size > 5 ? ` … (+${slugsSeen.size - 5} más)` : ''}`);
console.log('\nEl CSV está listo para importar con:\n   npm run import:dev -- ' + csvPath + '\n');
