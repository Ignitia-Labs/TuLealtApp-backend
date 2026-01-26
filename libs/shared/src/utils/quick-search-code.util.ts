/**
 * Utilidades para generación de códigos de búsqueda rápida para Tenants y Branches
 * Estos códigos son fáciles de teclear por humanos y se convertirán en QR codes
 */

/**
 * Caracteres permitidos para códigos legibles (sin caracteres confusos)
 * Excluye: 0, O, 1, I, l (confusos)
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Genera un código único legible para un tenant
 *
 * Formato: TENANT-{6 caracteres alfanuméricos sin confusión}
 *
 * @param length Longitud del código aleatorio (default: 6)
 * @returns Código generado
 *
 * @example
 * generateTenantQuickSearchCode();
 * // Resultado: "TENANT-ABC234"
 */
export function generateTenantQuickSearchCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    code += SAFE_CHARS[randomIndex];
  }
  return `TENANT-${code}`;
}

/**
 * Genera un código único legible para una branch
 *
 * Formato: BRANCH-{6 caracteres alfanuméricos sin confusión}
 *
 * @param length Longitud del código aleatorio (default: 6)
 * @returns Código generado
 *
 * @example
 * generateBranchQuickSearchCode();
 * // Resultado: "BRANCH-ABC234"
 */
export function generateBranchQuickSearchCode(length: number = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * SAFE_CHARS.length);
    code += SAFE_CHARS[randomIndex];
  }
  return `BRANCH-${code}`;
}

/**
 * Valida el formato de un código de búsqueda rápida de tenant
 *
 * @param code Código a validar
 * @returns true si el formato es válido, false en caso contrario
 *
 * @example
 * isValidTenantQuickSearchCode('TENANT-ABC234'); // true
 * isValidTenantQuickSearchCode('invalid-code'); // false
 */
export function isValidTenantQuickSearchCode(code: string): boolean {
  // Patrón: TENANT-{6 caracteres alfanuméricos sin confusión}
  const pattern = /^TENANT-[A-Z2-9]{6}$/;
  return pattern.test(code);
}

/**
 * Valida el formato de un código de búsqueda rápida de branch
 *
 * @param code Código a validar
 * @returns true si el formato es válido, false en caso contrario
 *
 * @example
 * isValidBranchQuickSearchCode('BRANCH-ABC234'); // true
 * isValidBranchQuickSearchCode('invalid-code'); // false
 */
export function isValidBranchQuickSearchCode(code: string): boolean {
  // Patrón: BRANCH-{6 caracteres alfanuméricos sin confusión}
  const pattern = /^BRANCH-[A-Z2-9]{6}$/;
  return pattern.test(code);
}

/**
 * Parsea un código de búsqueda rápida y determina su tipo
 *
 * @param code Código a parsear
 * @returns Objeto con el tipo y el código, o null si no es válido
 *
 * @example
 * parseQuickSearchCode('TENANT-ABC234'); // { type: 'tenant', code: 'TENANT-ABC234' }
 * parseQuickSearchCode('BRANCH-ABC234'); // { type: 'branch', code: 'BRANCH-ABC234' }
 * parseQuickSearchCode('invalid'); // null
 */
export function parseQuickSearchCode(
  code: string,
): { type: 'tenant' | 'branch'; code: string } | null {
  if (isValidTenantQuickSearchCode(code)) {
    return { type: 'tenant', code };
  }
  if (isValidBranchQuickSearchCode(code)) {
    return { type: 'branch', code };
  }
  return null;
}
