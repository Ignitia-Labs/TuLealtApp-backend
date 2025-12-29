import { SetMetadata } from '@nestjs/common';

/**
 * Clave para almacenar el tipo de recurso en los metadatos
 */
export const RESOURCE_TYPE_KEY = 'resourceType';

/**
 * Decorator para especificar el tipo de recurso en un endpoint
 * Útil para guards que validan ownership de recursos
 *
 * @example
 * @ResourceType('membership')
 * @Get('memberships/:id')
 * async getMembership(@Param('id') id: number) { ... }
 *
 * @param type Tipo de recurso (ej: 'membership', 'transaction', etc.)
 */
export const ResourceType = (type: string) => SetMetadata(RESOURCE_TYPE_KEY, type);

