/**
 * Convierte un texto en un slug URL-safe.
 * "Pasión por el vino"          → "pasion-por-el-vino"
 * "Copa de vino - Artículo 1"   → "copa-de-vino-articulo-1"
 */
// eslint-disable-next-line no-misleading-character-class
const COMBINING_MARKS = /[̀-ͯ]/g;

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')               // descompone 'á' → 'a' + marca de acento
    .replace(COMBINING_MARKS, '')   // elimina las marcas de acento
    .replace(/[^a-z0-9\s-]/g, '')  // elimina todo salvo letras, números, espacios y guiones
    .trim()
    .replace(/[\s-]+/g, '-');      // espacios y guiones consecutivos → un guion
}
