export const WHATSAPP_NUMBER = '212762934592'

/**
 * Build a WhatsApp click-to-chat link with an optional pre-filled message.
 * @param {string} message - Optional pre-filled text.
 * @returns {string} wa.me URL
 */
export const waLink = (message = '') =>
  `https://wa.me/${WHATSAPP_NUMBER}${message ? `?text=${encodeURIComponent(message)}` : ''}`