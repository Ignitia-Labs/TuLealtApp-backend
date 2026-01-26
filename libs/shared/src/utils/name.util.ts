/**
 * Utilidades para procesamiento de nombres
 */

/**
 * Extrae el primer nombre y apellido de un nombre completo
 * Maneja casos edge como nombres vacíos, nombres compuestos, etc.
 *
 * @param fullName Nombre completo a procesar
 * @returns Objeto con firstName y lastName
 *
 * @example
 * extractFirstNameAndLastName("Juan Pérez")
 * // { firstName: "Juan", lastName: "Pérez" }
 *
 * extractFirstNameAndLastName("María José García López")
 * // { firstName: "María", lastName: "José García López" }
 *
 * extractFirstNameAndLastName("Roberto")
 * // { firstName: "Roberto", lastName: "Roberto" }
 *
 * extractFirstNameAndLastName("")
 * // { firstName: "Usuario", lastName: "Partner" }
 */
export function extractFirstNameAndLastName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  // Normalizar: trim y reemplazar múltiples espacios con uno solo
  const normalized = (fullName || '').trim().replace(/\s+/g, ' ');

  // Si el nombre está vacío después de normalizar, usar valores por defecto
  if (!normalized) {
    return {
      firstName: 'Usuario',
      lastName: 'Partner',
    };
  }

  // Dividir por espacios
  const parts = normalized.split(' ').filter((part) => part.length > 0);

  // Si solo hay una palabra, usar la misma para ambos
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: parts[0],
    };
  }

  // Si hay dos palabras, primera es firstName, segunda es lastName
  if (parts.length === 2) {
    return {
      firstName: parts[0],
      lastName: parts[1],
    };
  }

  // Si hay más de dos palabras:
  // - Primera palabra es firstName
  // - Resto de palabras unidas son lastName
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
