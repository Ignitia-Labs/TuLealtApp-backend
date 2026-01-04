import { UserPermission } from '../entities/user-permission.entity';

/**
 * Interfaz del repositorio de asignaciones de permisos a usuarios
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IUserPermissionRepository {
  /**
   * Busca una asignación por su ID
   */
  findById(id: number): Promise<UserPermission | null>;

  /**
   * Busca todas las asignaciones de un usuario (activas e inactivas si includeInactive = true)
   */
  findByUserId(userId: number, includeInactive?: boolean): Promise<UserPermission[]>;

  /**
   * Busca todas las asignaciones de un permiso específico
   */
  findByPermissionId(permissionId: number): Promise<UserPermission[]>;

  /**
   * Busca solo las asignaciones activas de un usuario
   */
  findActiveByUserId(userId: number): Promise<UserPermission[]>;

  /**
   * Guarda una nueva asignación
   */
  save(userPermission: UserPermission): Promise<UserPermission>;

  /**
   * Actualiza una asignación existente
   */
  update(userPermission: UserPermission): Promise<UserPermission>;

  /**
   * Elimina una asignación por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Verifica si existe una asignación activa para un usuario y permiso específicos
   */
  exists(userId: number, permissionId: number): Promise<boolean>;

  /**
   * Busca asignaciones activas de un permiso específico
   */
  findActiveByPermissionId(permissionId: number): Promise<UserPermission[]>;
}

