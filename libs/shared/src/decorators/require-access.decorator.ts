import { SetMetadata } from '@nestjs/common';

/**
 * Clave para almacenar el acceso requerido en los metadatos
 */
export const REQUIRE_ACCESS_KEY = 'require_access';

/**
 * Interfaz para el metadata de acceso requerido
 */
export interface RequireAccessMetadata {
  module: string;
  resource: string;
  action: string;
}

/**
 * Decorator para especificar el acceso requerido usando módulo, recurso y acción
 *
 * Este decorator construye automáticamente el permiso en formato "module.resource.action"
 * y puede ser usado como alternativa más legible a @Permissions()
 *
 * @example
 * @RequireAccess('admin', 'users', 'create')
 * @Post('users')
 * async createUser() { ... }
 *
 * @example
 * @RequireAccess('partner', 'products', 'view')
 * @Get('products')
 * async getProducts() { ... }
 */
export const RequireAccess = (module: string, resource: string, action: string) =>
  SetMetadata(REQUIRE_ACCESS_KEY, { module, resource, action });

