import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '@libs/application';
import { RESOURCE_TYPE_KEY } from '../decorators/resource-type.decorator';

/**
 * Interfaz del repositorio de customer memberships
 * Se define aquí para evitar dependencia circular
 */
interface ICustomerMembershipRepository {
  findById(id: number): Promise<{ userId: number } | null>;
}

/**
 * Guard para validar que un customer solo acceda a sus propios recursos
 *
 * Este guard valida que cuando un usuario con rol CUSTOMER intenta acceder a un recurso,
 * ese recurso pertenezca al usuario autenticado.
 *
 * Debe usarse después de JwtAuthGuard para asegurar que el usuario esté autenticado
 *
 * @example
 * @UseGuards(JwtAuthGuard, CustomerResourceGuard)
 * @ResourceType('membership')
 * @Get('memberships/:id')
 * async getMembership(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
 *   // El guard valida automáticamente que la membership pertenece al usuario
 * }
 */
@Injectable()
export class CustomerResourceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional()
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository?: ICustomerMembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Si no hay usuario autenticado, dejar que otros guards manejen
    if (!user) {
      return true;
    }

    // Si no es customer, permitir (otros guards manejan otros roles)
    if (!user.roles.includes('CUSTOMER')) {
      return true;
    }

    // Obtener el tipo de recurso del decorator @ResourceType
    const resourceType = this.reflector.get<string>(RESOURCE_TYPE_KEY, context.getHandler());

    // Si no hay tipo de recurso especificado, permitir (no hay validación específica)
    if (!resourceType) {
      return true;
    }

    // Obtener el ID del recurso de los parámetros
    const resourceId = request.params.id || request.params.membershipId;

    if (!resourceId) {
      return true; // No hay ID para validar
    }

    // Validar según el tipo de recurso
    if (resourceType === 'membership') {
      // Si el repositorio no está disponible aún, permitir (se validará en handlers)
      if (!this.membershipRepository) {
        return true;
      }

      const membership = await this.membershipRepository.findById(parseInt(resourceId));

      if (!membership) {
        throw new ForbiddenException('Resource not found');
      }

      if (membership.userId !== user.userId) {
        throw new ForbiddenException('You can only access your own resources');
      }
    }

    return true;
  }
}
