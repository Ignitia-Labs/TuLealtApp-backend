import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { JwtPayload } from '@libs/application';

/**
 * Interfaz del repositorio de usuarios
 * Se define aquí para evitar dependencia circular
 */
interface IUserRepository {
  findById(id: number): Promise<{ partnerId: number | null } | null>;
}

/**
 * Interfaz del repositorio de perfiles
 * Se define aquí para evitar dependencia circular
 */
interface IProfileRepository {
  findById(id: number): Promise<{ partnerId: number | null } | null>;
}

/**
 * Interfaz del repositorio de asignaciones de perfiles
 * Se define aquí para evitar dependencia circular
 */
interface IUserProfileRepository {
  findById(id: number): Promise<{ userId: number } | null>;
}

/**
 * Interfaz del repositorio de tenants
 * Se define aquí para evitar dependencia circular
 */
interface ITenantRepository {
  findById(id: number): Promise<{ partnerId: number } | null>;
}

/**
 * Interfaz del repositorio de branches
 * Se define aquí para evitar dependencia circular
 */
interface IBranchRepository {
  findById(id: number): Promise<{ tenantId: number } | null>;
}

/**
 * Guard para validar que un partner solo acceda a sus propios recursos
 *
 * Este guard valida que cuando un usuario con rol PARTNER o PARTNER_STAFF intenta acceder a un recurso,
 * ese recurso pertenezca al partner del usuario autenticado.
 *
 * Debe usarse después de JwtAuthGuard para asegurar que el usuario esté autenticado
 *
 * @example
 * @UseGuards(JwtAuthGuard, RolesGuard, PartnerResourceGuard)
 * @Roles('PARTNER', 'PARTNER_STAFF')
 * @Get('profiles/:id')
 * async getProfile(@Param('id') id: number, @CurrentUser() user: JwtPayload) {
 *   // El guard valida automáticamente que el perfil pertenece al partner del usuario
 * }
 */
@Injectable()
export class PartnerResourceGuard implements CanActivate {
  constructor(
    @Optional()
    @Inject('IUserRepository')
    private readonly userRepository?: IUserRepository,
    @Optional()
    @Inject('IProfileRepository')
    private readonly profileRepository?: IProfileRepository,
    @Optional()
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository?: IUserProfileRepository,
    @Optional()
    @Inject('ITenantRepository')
    private readonly tenantRepository?: ITenantRepository,
    @Optional()
    @Inject('IBranchRepository')
    private readonly branchRepository?: IBranchRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    // Si no hay usuario autenticado, dejar que otros guards manejen
    if (!user) {
      return true;
    }

    // Si no es PARTNER o PARTNER_STAFF, permitir (otros guards manejan otros roles)
    const isPartnerOrStaff = user.roles.includes('PARTNER') || user.roles.includes('PARTNER_STAFF');
    if (!isPartnerOrStaff) {
      return true;
    }

    // Si el repositorio de usuarios no está disponible, permitir (se validará en handlers)
    if (!this.userRepository) {
      return true;
    }

    // Obtener el partnerId del usuario autenticado
    const userEntity = await this.userRepository.findById(user.userId);
    if (!userEntity) {
      throw new ForbiddenException('User not found');
    }

    const userPartnerId = userEntity.partnerId;
    if (!userPartnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // Validar recursos según los parámetros de la ruta
    const profileId = request.params.id || request.params.profileId;
    const userId = request.params.userId;
    const userProfileId =
      request.params.id && request.path.includes('user-profiles') ? request.params.id : null;
    const tenantId =
      request.params.id && request.path.includes('tenants')
        ? request.params.id
        : request.params.tenantId;
    const branchId =
      request.params.id && request.path.includes('branches') ? request.params.id : null;

    // Validar perfil si se accede a un perfil
    if (profileId && this.profileRepository && request.path.includes('profiles')) {
      const profile = await this.profileRepository.findById(parseInt(profileId));
      if (!profile) {
        // Permitir que el handler maneje el 404
        return true;
      }

      // El perfil debe pertenecer al partner del usuario (o ser global, null)
      // Los perfiles globales pueden ser vistos por todos los partners
      if (profile.partnerId !== null && profile.partnerId !== userPartnerId) {
        throw new ForbiddenException('You can only access profiles from your partner');
      }
    }

    // Validar usuario si se accede a un usuario
    if (userId && this.userRepository) {
      const targetUser = await this.userRepository.findById(parseInt(userId));
      if (!targetUser) {
        // Permitir que el handler maneje el 404
        return true;
      }

      // El usuario debe pertenecer al partner del usuario autenticado
      if (targetUser.partnerId !== userPartnerId) {
        throw new ForbiddenException('You can only access users from your partner');
      }
    }

    // Validar asignación de perfil si se accede a una asignación
    if (userProfileId && this.userProfileRepository && request.path.includes('user-profiles')) {
      const userProfile = await this.userProfileRepository.findById(parseInt(userProfileId));
      if (!userProfile) {
        // Permitir que el handler maneje el 404
        return true;
      }

      // Obtener el usuario de la asignación y validar que pertenezca al partner
      if (this.userRepository) {
        const assignedUser = await this.userRepository.findById(userProfile.userId);
        if (assignedUser && assignedUser.partnerId !== userPartnerId) {
          throw new ForbiddenException(
            'You can only access user profile assignments from your partner',
          );
        }
      }
    }

    // Validar tenant si se accede a un tenant
    if (tenantId && this.tenantRepository && request.path.includes('tenants')) {
      const tenant = await this.tenantRepository.findById(parseInt(tenantId));
      if (!tenant) {
        // Permitir que el handler maneje el 404
        return true;
      }

      // El tenant debe pertenecer al partner del usuario autenticado
      if (tenant.partnerId !== userPartnerId) {
        throw new ForbiddenException('You can only access tenants from your partner');
      }
    }

    // Validar branch si se accede a una branch
    if (branchId && this.branchRepository && request.path.includes('branches')) {
      const branch = await this.branchRepository.findById(parseInt(branchId));
      if (!branch) {
        // Permitir que el handler maneje el 404
        return true;
      }

      // Obtener el tenant de la branch y validar que pertenezca al partner
      if (this.tenantRepository) {
        const tenant = await this.tenantRepository.findById(branch.tenantId);
        if (!tenant) {
          // Permitir que el handler maneje el 404
          return true;
        }

        // El tenant debe pertenecer al partner del usuario autenticado
        if (tenant.partnerId !== userPartnerId) {
          throw new ForbiddenException('You can only access branches from your partner');
        }
      }
    }

    return true;
  }
}
