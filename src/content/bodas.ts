// ============================================================
// Contenido editable de la página "bodas"
// ------------------------------------------------------------
// Objetivo de la página: vender packs de productos a precio especial
// para wedding planners. Valores POR DEFECTO = textos de ejemplo; la
// clienta los edita desde Admin → Páginas → Bodas.
//
// "*cursiva*" se renderiza en Playfair itálica si el campo es `rich`.
// ============================================================

export interface Pack {
  id: string;
  titulo: string;
  precio: string;        // texto libre: "desde 3 €/invitado", "a consultar", etc.
  recomendado: boolean;  // resalta la tarjeta + badge "Recomendado"
  incluye: string[];     // líneas de "qué incluye"
  cta: string;           // texto del botón
}

export interface BodasContent {
  hero: { eyebrow: string; titulo: string; subtitulo: string; cta: string };
  packsTitulo: string;
  packs: Pack[];
  ventajas: { titulo: string; items: string[] };
  cta: { titulo: string; subtitulo: string; boton: string };
}

export const BODAS_DEFAULTS: BodasContent = {
  hero: {
    eyebrow: 'Bodas · wedding planners',
    titulo: 'Detalles de boda, con precio de profesional',
    subtitulo:
      'Packs de recuerdos personalizados y hechos a mano para las bodas que organizas, ' +
      'con condiciones especiales para wedding planners.',
    cta: 'Pedir presupuesto por WhatsApp',
  },
  packsTitulo: 'Nuestros packs de boda',
  packs: [
    {
      id: 'invitados',
      titulo: 'Pack invitados',
      precio: 'desde 3 €/invitado',
      recomendado: false,
      incluye: [
        'Recuerdo personalizado para cada invitado',
        'Diseño a medida con vuestros nombres y fecha',
        'Presentación cuidada lista para entregar',
      ],
      cta: 'Quiero este pack',
    },
    {
      id: 'completo',
      titulo: 'Pack completo',
      precio: 'desde 6 €/invitado',
      recomendado: true,
      incluye: [
        'Todo lo del pack invitados',
        'Porta-alianzas de madera grabado',
        '2 copas de cava grabadas para el brindis',
        'Detalle para la mesa de los novios',
      ],
      cta: 'Quiero este pack',
    },
    {
      id: 'medida',
      titulo: 'Pack a medida',
      precio: 'a consultar',
      recomendado: false,
      incluye: [
        'Lo diseñamos contigo de cero',
        'Sin límite de personalización',
        'Asesoramiento cercano en cada detalle',
      ],
      cta: 'Hablar de mi boda',
    },
  ],
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
    packsTitulo: stored.packsTitulo ?? d.packsTitulo,
    packs: Array.isArray(stored.packs) && stored.packs.length > 0
      ? (stored.packs as Pack[])
      : d.packs,
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
