import { SetMetadata } from '@nestjs/common';

/**
 * Clave para almacenar los permisos requeridos en los metadatos
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator para especificar los permisos requeridos para acceder a un endpoint
 *
 * El guard PermissionsGuard validará que el usuario tenga al menos uno de los permisos especificados.
 * Los permisos deben estar en formato: "module.resource.action"
 *
 * @example
 * @Permissions('admin.users.create')
 * @Post('users')
 * async createUser() { ... }
 *
 * @example
 * @Permissions('admin.users.create', 'admin.users.update')
 * @Post('users')
 * async createOrUpdateUser() { ... }
 *
 * @example
 * @Permissions('admin.*')
 * @Get('admin-only')
 * async adminOnly() { ... }
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

