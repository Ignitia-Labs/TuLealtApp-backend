/**
 * Utilidades para generación de contraseñas seguras
 */

/**
 * Caracteres permitidos para contraseñas seguras
 */
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';

/**
 * Combina todos los caracteres permitidos
 */
const ALL_CHARS = UPPERCASE + LOWERCASE + NUMBERS;

/**
 * Genera un número aleatorio seguro usando crypto si está disponible
 * @param max Valor máximo (exclusivo)
 * @returns Número aleatorio entre 0 y max-1
 */
function getRandomInt(max: number): number {
  // Usar crypto.getRandomValues si está disponible (navegador/Node.js moderno)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    return randomArray[0] % max;
  }
  // Fallback a Math.random() si crypto no está disponible
  return Math.floor(Math.random() * max);
}

/**
 * Genera una contraseña aleatoria segura
 * La contraseña incluye letras mayúsculas, minúsculas y números
 *
 * @param length Longitud de la contraseña (default: 12)
 * @returns Contraseña aleatoria generada
 *
 * @example
 * generateRandomPassword(); // "aB3cD9eF2gH1"
 * generateRandomPassword(16); // "aB3cD9eF2gH1iJ4kL5"
 */
export function generateRandomPassword(length: number = 12): string {
  if (length < 4) {
    throw new Error('Password length must be at least 4 characters');
  }

  let password = '';

  // Asegurar que la contraseña tenga al menos un carácter de cada tipo
  // Esto garantiza que la contraseña sea segura
  password += UPPERCASE[getRandomInt(UPPERCASE.length)];
  password += LOWERCASE[getRandomInt(LOWERCASE.length)];
  password += NUMBERS[getRandomInt(NUMBERS.length)];

  // Completar el resto de la longitud con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += ALL_CHARS[getRandomInt(ALL_CHARS.length)];
  }

  // Mezclar los caracteres para que no siempre empiecen en el mismo orden
  // Convertir a array, mezclar, y volver a string
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}
