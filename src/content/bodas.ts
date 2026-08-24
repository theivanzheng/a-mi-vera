// ============================================================
// Contenido editable de la página "bodas"
// ------------------------------------------------------------
// Objetivo de la página: mostrar a los wedding planners los productos
// reales de la categoría "Vivan los novios" (no packs inventados —
// decisión de la clienta). Valores POR DEFECTO = textos de ejemplo; la
// clienta los edita desde Admin → Páginas → Bodas.
//
// "*cursiva*" se renderiza en Playfair itálica si el campo es `rich`.
// ============================================================

export interface BodasContent {
  hero: { eyebrow: string; titulo: string; subtitulo: string; cta: string };
  productosTitulo: string;
  ventajas: { titulo: string; items: string[] };
  cta: { titulo: string; subtitulo: string; boton: string };
}

export const BODAS_DEFAULTS: BodasContent = {
  hero: {
    eyebrow: 'Bodas · wedding planners',
    titulo: 'Detalles de boda, con precio de profesional',
    subtitulo:
      'Recuerdos personalizados y hechos a mano para las bodas que organizas, ' +
      'con condiciones especiales para wedding planners.',
    cta: 'Pedir presupuesto por WhatsApp',
  },
  productosTitulo: 'Nuestros detalles para bodas',
  ventajas: {
    titulo: 'Por qué trabajar con A Mi Vera',
    items: [
      'Condiciones especiales por volumen de pedido',
      'Plazos coordinados con tu calendario de eventos',
      'Personalización 1 a 1 para cada pareja',
      'Trato directo con el taller, sin intermediarios',
    ],
  },
  cta: {
    titulo: '¿Organizas bodas? Colaboremos',
    subtitulo: 'Cuéntanos tu próxima boda y preparamos un presupuesto a tu medida.',
    boton: 'Hablar por WhatsApp →',
  },
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function mergeBodasContent(
  stored: DeepPartial<BodasContent> | null | undefined,
): BodasContent {
  if (!stored) return BODAS_DEFAULTS;
  const d = BODAS_DEFAULTS;
  const storedItems = stored.ventajas?.items;
  return {
    hero: { ...d.hero, ...stored.hero },
    productosTitulo: stored.productosTitulo ?? d.productosTitulo,
    ventajas: {
      ...d.ventajas,
      ...stored.ventajas,
      items: Array.isArray(storedItems) && storedItems.length > 0
        ? (storedItems as string[])
        : d.ventajas.items,
    },
    cta: { ...d.cta, ...stored.cta },
  };
}
