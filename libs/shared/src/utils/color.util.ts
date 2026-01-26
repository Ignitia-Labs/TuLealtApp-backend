/**
 * Utilidades para generación de colores desde strings
 * Genera colores consistentes y visualmente agradables basados en un string
 */

/**
 * Genera un hash simple de un string
 * @param str String a hashear
 * @returns Número hash
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Convierte un número a un componente RGB válido (0-255)
 * @param value Valor numérico
 * @returns Componente RGB (0-255)
 */
function toRGBComponent(value: number): number {
  return value % 256;
}

/**
 * Ajusta un componente RGB para asegurar que el color sea legible
 * Evita colores muy claros (cerca de 255) o muy oscuros (cerca de 0)
 * @param component Componente RGB (0-255)
 * @param min Mínimo permitido (default: 50)
 * @param max Máximo permitido (default: 200)
 * @returns Componente ajustado
 */
function adjustComponent(component: number, min: number = 50, max: number = 200): number {
  // Normalizar al rango [min, max]
  const normalized = min + (component % (max - min));
  return Math.floor(normalized);
}

/**
 * Genera un color complementario basado en un color RGB
 * @param r Componente rojo (0-255)
 * @param g Componente verde (0-255)
 * @param b Componente azul (0-255)
 * @returns Color complementario en formato { r, g, b }
 */
function generateComplementary(r: number, g: number, b: number): { r: number; g: number; b: number } {
  // Color complementario: invertir y ajustar
  const compR = adjustComponent(255 - r, 80, 220);
  const compG = adjustComponent(255 - g, 80, 220);
  const compB = adjustComponent(255 - b, 80, 220);
  return { r: compR, g: compG, b: compB };
}

/**
 * Convierte componentes RGB a formato hexadecimal
 * @param r Componente rojo (0-255)
 * @param g Componente verde (0-255)
 * @param b Componente azul (0-255)
 * @returns Color en formato hexadecimal (#RRGGBB)
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.floor(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Genera colores primario y secundario desde un string
 * Los colores son consistentes para el mismo string y visualmente agradables
 *
 * @param name String del cual generar los colores (ej: nombre del partner)
 * @returns Objeto con colores primario y secundario en formato hexadecimal
 *
 * @example
 * generateColorsFromString('Café Delicia');
 * // Resultado: { primary: '#A3B5C7', secondary: '#5C4A38' }
 */
export function generateColorsFromString(name: string): { primary: string; secondary: string } {
  if (!name || name.trim().length === 0) {
    // Valores por defecto si el nombre está vacío
    return {
      primary: '#ec4899',
      secondary: '#fbbf24',
    };
  }

  // Normalizar el string (trim y lowercase para consistencia)
  const normalizedName = name.trim().toLowerCase();

  // Generar hash del string
  const hash = simpleHash(normalizedName);

  // Extraer componentes RGB del hash
  const r1 = toRGBComponent(hash);
  const g1 = toRGBComponent(hash >> 8);
  const b1 = toRGBComponent(hash >> 16);

  // Ajustar componentes para colores legibles
  const r = adjustComponent(r1, 60, 200);
  const g = adjustComponent(g1, 60, 200);
  const b = adjustComponent(b1, 60, 200);

  // Generar color primario (más saturado)
  const primary = rgbToHex(r, g, b);

  // Generar color secundario (complementario)
  const complementary = generateComplementary(r, g, b);
  const secondary = rgbToHex(complementary.r, complementary.g, complementary.b);

  return {
    primary,
    secondary,
  };
}
