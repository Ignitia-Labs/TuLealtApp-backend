/**
 * Utilidades para generación de QR codes
 */

/**
 * Opciones para generar un QR code
 */
export interface GenerateQrCodeOptions {
  userId: number;
  tenantId: number;
  randomLength?: number; // Longitud del componente aleatorio (default: 6)
  prefix?: string; // Prefijo personalizado (default: 'QR-USER')
}

/**
 * Genera un QR code único para una membership
 *
 * Formato: QR-USER-{userId}-TENANT-{tenantId}-{random}
 *
 * @param options Opciones para generar el QR code
 * @returns QR code generado
 *
 * @example
 * const qrCode = generateMembershipQrCode({ userId: 10, tenantId: 1 });
 * // Resultado: "QR-USER-10-TENANT-1-A3B5C7"
 */
export function generateMembershipQrCode(options: GenerateQrCodeOptions): string {
  const { userId, tenantId, randomLength = 6, prefix = 'QR-USER' } = options;

  // Generar componente aleatorio
  const random = Math.random()
    .toString(36)
    .substring(2, 2 + randomLength)
    .toUpperCase();

  // Construir QR code
  return `${prefix}-${userId}-TENANT-${tenantId}-${random}`;
}

/**
 * Valida el formato de un QR code de membership
 *
 * @param qrCode QR code a validar
 * @returns true si el formato es válido, false en caso contrario
 *
 * @example
 * isValidMembershipQrCode('QR-USER-10-TENANT-1-A3B5C7'); // true
 * isValidMembershipQrCode('invalid-qr-code'); // false
 */
export function isValidMembershipQrCode(qrCode: string): boolean {
  // Patrón: QR-USER-{number}-TENANT-{number}-{alphanumeric}
  const pattern = /^QR-USER-\d+-TENANT-\d+-[A-Z0-9]+$/i;
  return pattern.test(qrCode);
}

/**
 * Extrae el userId y tenantId de un QR code válido
 *
 * @param qrCode QR code del cual extraer la información
 * @returns Objeto con userId y tenantId, o null si el formato es inválido
 *
 * @example
 * extractMembershipInfo('QR-USER-10-TENANT-1-A3B5C7');
 * // Resultado: { userId: 10, tenantId: 1 }
 */
export function extractMembershipInfo(qrCode: string): { userId: number; tenantId: number } | null {
  if (!isValidMembershipQrCode(qrCode)) {
    return null;
  }

  const match = qrCode.match(/^QR-USER-(\d+)-TENANT-(\d+)-/i);
  if (!match) {
    return null;
  }

  return {
    userId: parseInt(match[1], 10),
    tenantId: parseInt(match[2], 10),
  };
}
