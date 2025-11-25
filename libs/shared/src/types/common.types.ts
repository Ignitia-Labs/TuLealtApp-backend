/**
 * Tipos comunes compartidos entre todas las capas
 */

/**
 * Resultado paginado genérico
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}
