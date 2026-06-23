// ============================================================
// Contenido editable de la página "nosotros" (Conócenos)
// ------------------------------------------------------------
// Valores POR DEFECTO = los textos actuales de la web. Si Supabase no
// tiene contenido para esta página, se usan estos, así la web se ve
// idéntica hasta que la clienta edite algo desde el admin.
//
// Los textos con varias líneas usan "\n"; "*cursiva*" se renderiza en
// Playfair itálica cuando el campo es `rich`.
// ============================================================

// Un bloque de la página: etiqueta + título + párrafo + vídeo opcional.
export interface NosotrosBloque {
  eyebrow: string;
  titulo: string;
  parrafo: string;
  video?: string; // URL en Storage; si falta, se usa el vídeo del proyecto
}

export interface NosotrosContent {
  hero: { eyebrow: string; titulo: string; subtitulo: string; cta: string; video?: string };
  taller: NosotrosBloque;
  laser: NosotrosBloque & { ventajas: string[] };
  personalizacion: NosotrosBloque;
  cta: { titulo: string; subtitulo: string; boton: string };
}

export const NOSOTROS_DEFAULTS: NosotrosContent = {
  hero: {
    eyebrow: 'Nosotros',
    titulo: 'Detrás de cada regalo,\nuna historia',
    subtitulo:
      'En A Mi Vera convertimos ideas en regalos personalizados hechos a mano. ' +
      'Sin prisa, sin moldes, con cariño en cada detalle.',
    cta: 'Hacer pedido por WhatsApp',
  },
  taller: {
    eyebrow: 'El taller',
    titulo: 'Donde nace cada pieza',
    parrafo:
      'Cada pieza pasa por nuestras manos de principio a fin. Diseñamos contigo la idea, la ' +
      'grabamos con mimo y la rematamos a mano hasta que queda perfecta. Nada de producción ' +
      'en serie: aquí cada regalo se piensa, se prueba y se cuida como si fuera para nosotros.',
  },
  laser: {
    eyebrow: 'Tecnología',
    titulo: 'Nuestra máquina de grabado láser',
    parrafo:
      'Nos obsesiona el detalle, y por eso invertimos en la mejor maquinaria posible. ' +
      'Grabamos con una *xTool*, una de las máquinas de grabado láser de referencia del ' +
      'mercado, que nos permite una precisión imposible de lograr a mano sobre madera, ' +
      'metacrilato, cuero o metal. Mejor herramienta, mejor acabado, mejor regalo.',
    ventajas: [
      'Precisión milimétrica en cada grabado',
      'Graba sobre madera, metacrilato, cuero, metal y más',
      'Acabados limpios, nítidos y duraderos',
      'Lo último en tecnología de grabado láser',
    ],
  },
  personalizacion: {
    eyebrow: 'A tu medida',
    titulo: 'Personalización 1 a 1',
    parrafo:
      'Hablamos contigo de tú a tú y adaptamos cada regalo a lo que quieres transmitir: un ' +
      'nombre, una fecha, una foto o una frase que solo vosotros entendéis. Tú lo imaginas y ' +
      'nosotros lo hacemos realidad, sin moldes ni catálogos cerrados.',
  },
  cta: {
    titulo: 'Cuéntanos qué quieres regalar',
    subtitulo: 'Respondemos en menos de 24 horas y lo diseñamos juntos, sin compromiso.',
    boton: 'Escribir por WhatsApp →',
  },
};

// Fusiona el contenido guardado (parcial) sobre los valores por defecto, sección
// a sección. Cualquier campo ausente cae al defecto → nunca quedan huecos vacíos.
// La lista de ventajas se reemplaza entera si viene guardada con elementos.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export function mergeNosotrosContent(
  stored: DeepPartial<NosotrosContent> | null | undefined,
): NosotrosContent {
  if (!stored) return NOSOTROS_DEFAULTS;
  const d = NOSOTROS_DEFAULTS;
  const ventajas =
    Array.isArray(stored.laser?.ventajas) && stored.laser!.ventajas!.length > 0
      ? (stored.laser!.ventajas as string[])
      : d.laser.ventajas;
  return {
    hero: { ...d.hero, ...stored.hero },
    taller: { ...d.taller, ...stored.taller },
    laser: { ...d.laser, ...stored.laser, ventajas },
    personalizacion: { ...d.personalizacion, ...stored.personalizacion },
    cta: { ...d.cta, ...stored.cta },
  };
}
