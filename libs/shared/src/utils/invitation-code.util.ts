/**
 * Utilidades para generación de códigos de invitación
 * Estos códigos son fáciles de teclear por humanos y se usarán para registro de customers
 */

/**
 * Caracteres permitidos para códigos legibles (sin caracteres confusos)
 * Excluye: 0, O, 1, I, l (confusos)
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Genera un código único legible para invitación
 *
 * Formato: INV-{8 caracteres alfanuméricos sin confusión}
 *
 * @param length Longitud del código aleatorio (default: 8)
 * @returns Código generado
 *
 * @example
 * generateInvitationCode();
 * // Resultado: "INV-ABC23456"
 */
export function generateInvitationCode(length: number = 8): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    code += SAFE_CHARS[randomIndex];
  }
  return `INV-${code}`;
}

/**
 * Valida el formato de un código de invitación
 *
 * @param code Código a validar
 * @returns true si el formato es válido, false en caso contrario
 *
 * @example
 * isValidInvitationCode('INV-ABC23456'); // true
 * isValidInvitationCode('invalid-code'); // false
 */
export function isValidInvitationCode(code: string): boolean {
  // Patrón: INV-{8 caracteres alfanuméricos sin confusión}
  const pattern = /^INV-[A-Z2-9]{8}$/;
  return pattern.test(code);
}
