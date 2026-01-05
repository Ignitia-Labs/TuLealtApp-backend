import { Injectable, Inject } from '@nestjs/common';
import {
  IUserProfileRepository,
  IProfileRepository,
  IUserPermissionRepository,
  IPermissionRepository,
  Profile,
} from '@libs/domain';

/**
 * Servicio para gestionar y validar permisos de usuarios
 * Consolida permisos de múltiples perfiles y permisos directos asignados
 */
@Injectable()
export class PermissionService {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
    @Inject('IUserPermissionRepository')
    private readonly userPermissionRepository: IUserPermissionRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  /**
   * Valida si un usuario tiene un permiso específico
   * Consolida permisos de perfiles activos y permisos directos asignados
   * Soporta wildcards (ej: "admin.*" coincide con "admin.users.create")
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    // Obtener todos los permisos del usuario (perfiles + directos)
    const userPermissions = await this.getUserPermissions(userId);

    // Logging temporal para diagnóstico
    console.log(
      `[PermissionService] Checking permission for userId=${userId}, permission=${permission}`,
    );
    console.log(
      `[PermissionService] User has ${userPermissions.length} permissions:`,
      userPermissions,
    );

    // Verificar permiso exacto
    if (userPermissions.includes(permission)) {
      console.log(`[PermissionService] Permission ${permission} found (exact match)`);
      return true;
    }

    // Verificar wildcards
    for (const userPermission of userPermissions) {
      if (this.matchesWildcard(userPermission, permission)) {
        console.log(
          `[PermissionService] Permission ${permission} found (wildcard match: ${userPermission})`,
        );
        return true;
      }
    }

    console.log(`[PermissionService] Permission ${permission} NOT found`);
    return false;
  }

  /**
   * Valida si un usuario puede realizar una acción en un recurso
   * Construye el permiso como "module.resource.action" y verifica con userHasPermission
   */
  async userCanAccess(
    userId: number,
    module: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const permission = `${module}.${resource}.${action}`;
    return this.userHasPermission(userId, permission);
  }

  /**
   * Obtiene todos los permisos de un usuario:
   * 1. Permisos de perfiles asignados (activos)
   * 2. Permisos directos asignados (activos)
   * Consolida todos los permisos y retorna array único
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const allPermissions = new Set<string>();

    // 1. Obtener permisos de perfiles asignados
    const activeAssignments = await this.userProfileRepository.findActiveByUserId(userId);
    console.log(
      `[PermissionService] Found ${activeAssignments.length} active profile assignments for userId=${userId}`,
    );

    for (const assignment of activeAssignments) {
      console.log(
        `[PermissionService] Processing profile assignment: profileId=${assignment.profileId}, isActive=${assignment.isActive}`,
      );
      const profile = await this.profileRepository.findById(assignment.profileId);
      if (profile && profile.isActive) {
        console.log(
          `[PermissionService] Profile ${profile.id} (${profile.name}) is active, fetching permissions...`,
        );
        // Obtener permisos desde profile_permissions
        // Después de eliminar la columna permissions, siempre se cargará desde profile_permissions
        const permissionsFromTable = await this.profileRepository.findPermissionsByProfileId(
          assignment.profileId,
        );
        // Usar permisos de tabla intermedia (después de migración, profile.permissions será array vacío)
        const profilePermissions = permissionsFromTable.length > 0 ? permissionsFromTable : [];
        console.log(
          `[PermissionService] Profile ${profile.id} has ${profilePermissions.length} permissions:`,
          profilePermissions,
        );

        for (const permissionCode of profilePermissions) {
          allPermissions.add(permissionCode);
        }
      } else {
        console.log(
          `[PermissionService] Profile ${assignment.profileId} is not active or not found`,
        );
      }
    }

    // 2. Obtener permisos directos asignados
    const userPermissions = await this.userPermissionRepository.findActiveByUserId(userId);
    console.log(
      `[PermissionService] Found ${userPermissions.length} direct permission assignments for userId=${userId}`,
    );
    for (const userPermission of userPermissions) {
      const permission = await this.permissionRepository.findById(userPermission.permissionId);
      if (permission && permission.isActive) {
        console.log(`[PermissionService] Adding direct permission: ${permission.code}`);
        allPermissions.add(permission.code);
      }
    }

    const finalPermissions = Array.from(allPermissions);
    console.log(
      `[PermissionService] Total consolidated permissions for userId=${userId}:`,
      finalPermissions,
    );
    return finalPermissions;
  }

  /**
   * Valida que los permisos existan en el catálogo centralizado
   * Retorna un objeto con arrays de permisos válidos e inválidos
   */
  async validatePermissionsExist(permissionCodes: string[]): Promise<{
    valid: string[];
    invalid: string[];
  }> {
    return this.permissionRepository.validatePermissions(permissionCodes);
  }

  /**
   * Valida formato de permiso: module.resource.action
   * Permite wildcards como "admin.*" o "partner.products.*"
   */
  validatePermissionFormat(permission: string): boolean {
    if (!permission || typeof permission !== 'string') {
      return false;
    }

    // Permitir wildcards al final (ej: "admin.*", "partner.products.*")
    if (permission.endsWith('.*')) {
      const parts = permission.slice(0, -2).split('.');
      // Debe tener al menos módulo (ej: "admin.*")
      return parts.length >= 1 && parts.every((part) => part.length > 0);
    }

    // Formato estándar: module.resource.action
    const parts = permission.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Cada parte debe ser no vacía
    return parts.every((part) => part.length > 0);
  }

  /**
   * Parsea un permiso en sus componentes
   * Retorna null si formato inválido
   */
  parsePermission(permission: string): { module: string; resource: string; action: string } | null {
    if (!this.validatePermissionFormat(permission)) {
      return null;
    }

    // Si tiene wildcard, no se puede parsear completamente
    if (permission.endsWith('.*')) {
      const module = permission.slice(0, -2);
      return {
        module,
        resource: '*',
        action: '*',
      };
    }

    const parts = permission.split('.');
    if (parts.length !== 3) {
      return null;
    }

    return {
      module: parts[0],
      resource: parts[1],
      action: parts[2],
    };
  }

  /**
   * Método privado para verificar coincidencia con wildcards
   * Ejemplos:
   * - "admin.*" coincide con "admin.users.create"
   * - "admin.users.*" coincide con "admin.users.create"
   * - "admin.*.create" NO coincide (wildcard solo al final)
   */
  private matchesWildcard(pattern: string, permission: string): boolean {
    if (!pattern.includes('*')) {
      return false;
    }

    // Solo permitir wildcard al final
    if (!pattern.endsWith('*')) {
      return false;
    }

    const prefix = pattern.slice(0, -1); // Remover el '*'
    return permission.startsWith(prefix);
  }
}
