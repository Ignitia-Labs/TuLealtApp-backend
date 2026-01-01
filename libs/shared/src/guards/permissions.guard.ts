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
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { REQUIRE_ACCESS_KEY, RequireAccessMetadata } from '../decorators/require-access.decorator';

/**
 * Interfaz del PermissionService
 * Se define aquí para evitar dependencia circular con libs/application
 */
interface IPermissionService {
  userHasPermission(userId: number, permission: string): Promise<boolean>;
  userCanAccess(userId: number, module: string, resource: string, action: string): Promise<boolean>;
}

/**
 * Guard para validar que el usuario tenga los permisos requeridos
 *
 * Este guard valida permisos granulares usando el formato "module.resource.action".
 * Debe usarse después de JwtAuthGuard para asegurar que el usuario esté autenticado.
 *
 * Los usuarios ADMIN (webmaster) tienen acceso completo automáticamente sin verificar permisos.
 * Los usuarios CUSTOMER no requieren validación de permisos (se omiten).
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @Permissions('admin.users.create')
 * @Post('users')
 * async createUser() { ... }
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @Permissions('admin.users.create', 'admin.users.update')
 * @Post('users')
 * async createOrUpdateUser() { ... }
 *
 * @example
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequireAccess('admin', 'users', 'view')
 * @Get('users')
 * async getUsers() { ... }
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional()
    @Inject('PermissionService')
    private readonly permissionService?: IPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener los permisos requeridos del decorator @Permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Obtener el acceso requerido del decorator @RequireAccess
    const requireAccess = this.reflector.getAllAndOverride<RequireAccessMetadata>(
      REQUIRE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos ni acceso requerido, permitir acceso
    if ((!requiredPermissions || requiredPermissions.length === 0) && !requireAccess) {
      return true;
    }

    // Obtener el usuario del request (inyectado por JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Omitir validación de permisos para usuarios ADMIN (webmaster - acceso completo)
    // Los usuarios ADMIN tienen todos los permisos concedidos automáticamente
    if (user.roles.includes('ADMIN')) {
      return true;
    }

    // Omitir validación de permisos para usuarios CUSTOMER
    // Los usuarios CUSTOMER tienen acceso basado en ownership, no en permisos granulares
    if (user.roles.includes('CUSTOMER')) {
      return true;
    }

    // Si el PermissionService no está disponible, permitir acceso
    // (puede ocurrir si el módulo no está configurado correctamente)
    if (!this.permissionService) {
      // En desarrollo, podríamos lanzar un error, pero en producción es mejor permitir
      // para evitar bloqueos si el servicio no está disponible
      console.warn('PermissionService not available. Allowing access.');
      return true;
    }

    // Construir lista de permisos a validar
    const permissionsToCheck: string[] = [];

    // Agregar permisos del decorator @Permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      permissionsToCheck.push(...requiredPermissions);
    }

    // Agregar permiso del decorator @RequireAccess
    if (requireAccess) {
      const permission = `${requireAccess.module}.${requireAccess.resource}.${requireAccess.action}`;
      permissionsToCheck.push(permission);
    }

    // Validar que el usuario tenga al menos uno de los permisos requeridos (OR logic)
    for (const permission of permissionsToCheck) {
      const hasPermission = await this.permissionService.userHasPermission(user.userId, permission);
      if (hasPermission) {
        return true;
      }
    }

    // Si no tiene ninguno de los permisos requeridos, denegar acceso
    throw new ForbiddenException(
      `User does not have required permissions. Required: ${permissionsToCheck.join(', ')}`,
    );
  }
}

