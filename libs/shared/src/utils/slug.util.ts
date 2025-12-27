/**
 * Utilidad para generar slugs a partir de texto
 * Convierte texto con espacios, tildes y caracteres especiales a un slug limpio
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalizar caracteres con tildes y diacríticos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    // Reemplazar espacios y guiones múltiples por un solo guion
    .replace(/[\s_-]+/g, '-')
    // Eliminar caracteres especiales excepto guiones
    .replace(/[^a-z0-9-]/g, '')
    // Eliminar guiones al inicio y final
    .replace(/^-+|-+$/g, '');
}

