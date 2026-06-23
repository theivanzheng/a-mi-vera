// ============================================================
// Contenido editable de la PORTADA (página "inicio")
// ------------------------------------------------------------
// Estos son los valores POR DEFECTO (los textos actuales de la web).
// Si Supabase no tiene contenido para esta página, se usan estos, así
// la web se ve idéntica hasta que la clienta edite algo desde el admin.
//
// Los textos con varias líneas usan "\n" como salto de línea.
// ============================================================

// Un "escaparate" = un carrusel de productos en la portada.
// La fuente decide QUÉ productos muestra (no se eligen uno a uno):
//   destacados → productos marcados como destacado
//   novedades  → los más recientes
//   categoria  → productos de una categoría (por slug)
export interface Escaparate {
  id: string;
  titulo: string;
  fuente: 'destacados' | 'novedades' | 'categoria';
  categoria?: string; // slug de la categoría, si fuente === 'categoria'
}

export interface HomeContent {
  hero: { titulo: string; pill: string; subtitulo: string; cta: string };
  ticker: string[];
  escaparates: Escaparate[];
  cristina: { eyebrow: string; titulo: string; parrafo: string; cta: string; video?: string };
  fraseOscura: { texto: string; firma: string };
  whatsapp: { eyebrow: string; titulo: string; subtitulo: string; boton: string };
}

export const HOME_DEFAULTS: HomeContent = {
  hero: {
    titulo: '"Cada regalo nace\nde una conversación."',
    pill: 'Regalos personalizados · Hechos a mano',
    subtitulo: 'Grabamos, personalizamos y enviamos con cariño para que tu regalo llegue perfecto.',
    cta: 'Descubre el Catálogo →',
  },
  ticker: [
    'Hecho a mano',
    'Personalizado para ti',
    'Envío 24h a toda la península',
    'Pack especial de envío',
    'Trato uno a uno',
    'Con cariño en cada detalle',
  ],
  escaparates: [
    { id: 'destacados', titulo: 'Productos Destacados', fuente: 'destacados' },
  ],
  cristina: {
    eyebrow: 'Conócenos',
    titulo: 'Hola! Soy Cristina',
    parrafo:
      'Creé A Mi Vera con una sola idea en mente: *"que cada regalo cuente una historia"*. ' +
      'Cada pieza que sale de mi taller la pienso especialmente para la persona que la va a recibir. ' +
      'No es producción en serie, no es un regalo más, es algo único, hecho con cariño, que se queda para siempre.',
    cta: 'Así lo hacemos →',
  },
  fraseOscura: {
    texto: '"No vendemos objetos.\nCreamos recuerdos."',
    firma: '— Cristina, fundadora de A Mi Vera',
  },
  whatsapp: {
    eyebrow: '¿Tienes algo en mente?',
    titulo: 'Cuéntame qué quieres regalar',
    subtitulo: 'Respondo en menos de 24 horas y lo diseñamos juntos, sin compromiso.',
    boton: 'Escribir por WhatsApp →',
  },
};

// Fusiona el contenido guardado (parcial) sobre los valores por defecto, sección
// a sección. Cualquier campo ausente cae al defecto → nunca quedan huecos vacíos.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function mergeHomeContent(stored: DeepPartial<HomeContent> | null | undefined): HomeContent {
  if (!stored) return HOME_DEFAULTS;
  return {
    hero: { ...HOME_DEFAULTS.hero, ...stored.hero },
    ticker: Array.isArray(stored.ticker) && stored.ticker.length > 0 ? stored.ticker as string[] : HOME_DEFAULTS.ticker,
    escaparates: Array.isArray(stored.escaparates) && stored.escaparates.length > 0
      ? (stored.escaparates as Escaparate[])
      : HOME_DEFAULTS.escaparates,
    cristina: { ...HOME_DEFAULTS.cristina, ...stored.cristina },
    fraseOscura: { ...HOME_DEFAULTS.fraseOscura, ...stored.fraseOscura },
    whatsapp: { ...HOME_DEFAULTS.whatsapp, ...stored.whatsapp },
  };
}
