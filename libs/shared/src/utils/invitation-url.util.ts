/**
 * Utilidades para construir URLs públicas de códigos de invitación
 */

/**
 * Construye la URL pública para registro con código de invitación
 * Esta URL apunta al Customer UI donde el usuario puede registrarse
 *
 * @param code Código de invitación (ej: "INV-ABC23456")
 * @returns URL completa con el código como parámetro de query
 *
 * @example
 * buildInvitationUrl('INV-ABC23456');
 * // Resultado: "http://localhost:3003/register?code=INV-ABC23456"
 */
export function buildInvitationUrl(code: string): string {
  const customerUiUrl = process.env.CUSTOMER_UI_URL || 'http://localhost:3003';
  // Remover trailing slash si existe
  const baseUrl = customerUiUrl.replace(/\/$/, '');
  // Codificar el código para URL
  const encodedCode = encodeURIComponent(code);
  return `${baseUrl}/register?code=${encodedCode}`;
}
