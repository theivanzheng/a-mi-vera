// Importación masiva de productos desde Excel (.xlsx) en el navegador.
// SheetJS (xlsx) se carga de forma diferida (dynamic import) para no engordar
// el bundle: solo se descarga cuando la admin usa la importación.

import type { ImageEntry, ProductTextFields } from './productsApi';

export interface ImportItem {
  fields: ProductTextFields;
  images: ImageEntry[];
}

export interface ImportParseResult {
  items: ImportItem[];   // filas válidas listas para crear
  notes: string[];       // filas omitidas o avisos (no bloquean a las válidas)
  error: string | null;  // error global (archivo ilegible / formato)
}

// Columnas de la plantilla (cabecera de la primera fila).
export const TEMPLATE_HEADERS = ['titulo', 'precio', 'categorias', 'descripcion', 'novedad', 'imagen_url'] as const;

function norm(v: unknown): string {
  return String(v ?? '').trim();
}

function isYes(v: unknown): boolean {
  const s = norm(v).toLowerCase();
  return s === 'si' || s === 'sí' || s === 'true' || s === '1' || s === 'x';
}

// Lee y valida un Excel. `knownCategories` = nombres de categoría existentes
// (para avisar de las que no existen; se omiten al crear).
export async function parseProductsExcel(
  file: File,
  knownCategories: string[],
): Promise<ImportParseResult> {
  let XLSX: typeof import('xlsx');
  try {
    XLSX = await import('xlsx');
  } catch {
    return { items: [], notes: [], error: 'No se pudo cargar el lector de Excel.' };
  }

  let rawRows: Record<string, unknown>[];
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return { items: [], notes: [], error: 'El archivo no tiene ninguna hoja.' };
    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } catch {
    return { items: [], notes: [], error: 'No se pudo leer el archivo. ¿Es un Excel válido (.xlsx)?' };
  }

  // Normaliza las cabeceras a minúsculas sin espacios.
  const rows = rawRows.map(r => {
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(r)) o[k.trim().toLowerCase()] = r[k];
    return o;
  });

  const knownLower = new Set(knownCategories.map(c => c.toLowerCase()));
  const items: ImportItem[] = [];
  const notes: string[] = [];

  rows.forEach((r, i) => {
    const fila = i + 2; // +1 cabecera, +1 índice base-1

    const titulo = norm(r['titulo'] ?? r['título'] ?? r['nombre']);
    const precioRaw = norm(r['precio']);

    // Fila completamente vacía → se ignora en silencio
    if (!titulo && !precioRaw) return;

    if (!titulo) { notes.push(`Fila ${fila}: omitida (falta el título).`); return; }

    const precio = parseFloat(precioRaw.replace(',', '.'));
    if (isNaN(precio) || precio < 0) {
      notes.push(`Fila ${fila} («${titulo}»): omitida (precio no válido: "${precioRaw}").`);
      return;
    }

    const cats = norm(r['categorias'] ?? r['categoría'] ?? r['categoria'])
      .split(/[;,]/).map(s => s.trim()).filter(Boolean);
    const unknown = cats.filter(c => !knownLower.has(c.toLowerCase()));
    if (unknown.length) {
      notes.push(`Fila ${fila} («${titulo}»): categoría(s) inexistente(s) y se omiten: ${unknown.join(', ')}.`);
    }
    const validCats = cats.filter(c => knownLower.has(c.toLowerCase()));

    const imageUrls = norm(r['imagen_url'] ?? r['imagenes'] ?? r['imagen'])
      .split(/[;\s]+/).map(s => s.trim()).filter(u => /^https?:\/\//i.test(u));

    items.push({
      fields: {
        title: titulo,
        price: String(precio),
        categories: validCats,
        description: norm(r['descripcion'] ?? r['descripción']),
        novedadFija: isYes(r['novedad'] ?? r['nuevo']),
        novedadHasta: null,
      },
      images: imageUrls.map(url => ({ kind: 'url' as const, url })),
    });
  });

  return { items, notes, error: null };
}

// Genera y descarga una plantilla .xlsx de ejemplo con la cabecera y 2 filas.
export async function downloadProductsTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const ejemplos = [
    {
      titulo: 'Copa de vino grabada',
      precio: 18.5,
      categorias: 'Pasión por el vino;Regalos únicos',
      descripcion: 'Copa personalizada con nombre y fecha.',
      novedad: 'no',
      imagen_url: '',
    },
    {
      titulo: 'Tabla de quesos personalizada',
      precio: 24,
      categorias: 'Pasión por la madera',
      descripcion: 'Tabla de madera grabada a medida.',
      novedad: 'si',
      imagen_url: '',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(ejemplos, { header: [...TEMPLATE_HEADERS] });
  ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 32 }, { wch: 40 }, { wch: 10 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  XLSX.writeFile(wb, 'plantilla-productos.xlsx');
}
