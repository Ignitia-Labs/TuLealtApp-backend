/**
 * Utilidades para generación de códigos de búsqueda rápida para partners
 * Estos códigos son fáciles de teclear por humanos y se convertirán en QR codes
 */

/**
 * Caracteres permitidos para códigos legibles (sin caracteres confusos)
 * Excluye: 0, O, 1, I, l (confusos)
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Genera un código único legible para un partner
 *
 * Formato: PARTNER-{6 caracteres alfanuméricos sin confusión}
 *
 * @param length Longitud del código aleatorio (default: 6)
 * @returns Código generado
 *
 * @example
 * generatePartnerQuickSearchCode();
 * // Resultado: "PARTNER-ABC234"
 */
export function generatePartnerQuickSearchCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    code += SAFE_CHARS[randomIndex];
  }
  return `PARTNER-${code}`;
}

/**
 * Valida el formato de un código de búsqueda rápida de partner
 *
 * @param code Código a validar
 * @returns true si el formato es válido, false en caso contrario
 *
 * @example
 * isValidPartnerQuickSearchCode('PARTNER-ABC234'); // true
 * isValidPartnerQuickSearchCode('invalid-code'); // false
 */
export function isValidPartnerQuickSearchCode(code: string): boolean {
  // Patrón: PARTNER-{6 caracteres alfanuméricos sin confusión}
  const pattern = /^PARTNER-[A-Z2-9]{6}$/;
  return pattern.test(code);
}
