import { SetMetadata } from '@nestjs/common';

/**
 * Clave para almacenar los roles requeridos en los metadatos
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator para especificar los roles requeridos para acceder a un endpoint
 *
 * @example
 * @Roles('ADMIN')
 * @Get('admin-only')
 * async adminOnly() { ... }
 *
 * @example
 * @Roles('ADMIN', 'PARTNER')
 * @Get('admin-or-partner')
 * async adminOrPartner() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
