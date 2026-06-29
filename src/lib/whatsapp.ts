// Número de WhatsApp de A Mi Vera (mismo que usa la ficha de producto).
export const WHATSAPP_NUMBER = '34646555027';

// URL pública del sitio. Fija al dominio real para que los enlaces que se
// comparten (p. ej. el del producto por WhatsApp) sean SIEMPRE el del dominio,
// nunca localhost ni el dominio temporal de Vercel.
export const SITE_URL = 'https://amivera13.es';

/** Construye un enlace wa.me con mensaje preescrito. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
