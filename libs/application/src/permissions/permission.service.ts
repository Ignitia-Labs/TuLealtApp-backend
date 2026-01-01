import { Injectable, Inject } from '@nestjs/common';
import { IUserProfileRepository, IProfileRepository, Profile } from '@libs/domain';

/**
 * Servicio para gestionar y validar permisos de usuarios
 * Consolida permisos de múltiples perfiles y valida acceso
 */
@Injectable()
export class PermissionService {
  constructor(
    @Inject('IUserProfileRepository')
    private readonly userProfileRepository: IUserProfileRepository,
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) {}

  /**
   * Valida si un usuario tiene un permiso específico
   * Consolida permisos de todos los perfiles activos del usuario
   * Soporta wildcards (ej: "admin.*" coincide con "admin.users.create")
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    // Obtener todos los permisos del usuario
    const userPermissions = await this.getUserPermissions(userId);

    // Verificar permiso exacto
    if (userPermissions.includes(permission)) {
      return true;
    }

    // Verificar wildcards
    for (const userPermission of userPermissions) {
      if (this.matchesWildcard(userPermission, permission)) {
        return true;
      }
    }

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
   * Obtiene todos los permisos de un usuario (de todos sus perfiles activos)
   * Consolida permisos de múltiples perfiles y retorna array único
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    // Obtener asignaciones activas del usuario
    const activeAssignments = await this.userProfileRepository.findActiveByUserId(userId);

    // Obtener todos los perfiles activos
    const profiles: Profile[] = [];
    for (const assignment of activeAssignments) {
      const profile = await this.profileRepository.findById(assignment.profileId);
      if (profile && profile.isActive) {
        profiles.push(profile);
      }
    }

    // Consolidar permisos de todos los perfiles
    const allPermissions = new Set<string>();
    for (const profile of profiles) {
      for (const permission of profile.permissions) {
        allPermissions.add(permission);
      }
    }

    return Array.from(allPermissions);
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
