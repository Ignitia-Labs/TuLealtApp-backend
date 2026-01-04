import { ProfilePermission } from '../entities/profile-permission.entity';

/**
 * Interfaz del repositorio de relaciones perfil-permiso
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IProfilePermissionRepository {
  /**
   * Busca una relación por su ID
   */
  findById(id: number): Promise<ProfilePermission | null>;

  /**
   * Busca todas las relaciones de un perfil específico
   */
  findByProfileId(profileId: number): Promise<ProfilePermission[]>;

  /**
   * Busca todas las relaciones de un permiso específico
   */
  findByPermissionId(permissionId: number): Promise<ProfilePermission[]>;

  /**
   * Verifica si existe una relación entre un perfil y un permiso
   */
  exists(profileId: number, permissionId: number): Promise<boolean>;

  /**
   * Guarda una nueva relación
   */
  save(profilePermission: ProfilePermission): Promise<ProfilePermission>;

  /**
   * Guarda múltiples relaciones en una transacción
   */
  saveMany(profilePermissions: ProfilePermission[]): Promise<ProfilePermission[]>;

  /**
   * Elimina una relación por profileId y permissionId
   */
  delete(profileId: number, permissionId: number): Promise<void>;

  /**
   * Elimina todas las relaciones de un perfil
   */
  deleteByProfileId(profileId: number): Promise<void>;

  /**
   * Elimina todas las relaciones de un permiso
   */
  deleteByPermissionId(permissionId: number): Promise<void>;
}

