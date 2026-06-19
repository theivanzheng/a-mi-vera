// Número de WhatsApp de A Mi Vera (mismo que usa la ficha de producto).
export const WHATSAPP_NUMBER = '34646555027';

/** Construye un enlace wa.me con mensaje preescrito. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
