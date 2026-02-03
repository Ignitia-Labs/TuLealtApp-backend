import { Profile } from '@libs/domain/entities/auth/profile.entity';

/**
 * Interfaz del repositorio de perfiles
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IProfileRepository {
  /**
   * Busca un perfil por su ID
   */
  findById(id: number): Promise<Profile | null>;

  /**
   * Busca perfiles por partnerId
   * Retorna todos los perfiles asociados a un partner específico
   */
  findByPartnerId(partnerId: number): Promise<Profile[]>;

  /**
   * Busca perfiles globales (partnerId = null)
   * Retorna todos los perfiles que pueden ser usados por cualquier partner
   */
  findGlobalProfiles(): Promise<Profile[]>;

  /**
   * Busca un perfil por nombre
   * Si se proporciona partnerId, busca solo en perfiles de ese partner o globales
   * Si partnerId es null, busca solo en perfiles globales
   */
  findByName(name: string, partnerId?: number | null): Promise<Profile | null>;

  /**
   * Guarda un nuevo perfil
   */
  save(profile: Profile): Promise<Profile>;

  /**
   * Actualiza un perfil existente
   */
  update(profile: Profile): Promise<Profile>;

  /**
   * Elimina un perfil por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Busca perfiles activos de un usuario
   * Retorna todos los perfiles que están asignados activamente a un usuario
   */
  findByUserId(userId: number): Promise<Profile[]>;

  /**
   * Obtiene los permisos de un perfil desde la tabla profile_permissions
   * Retorna array de códigos de permisos (strings)
   * Si el perfil no tiene permisos en profile_permissions, retorna array vacío
   */
  findPermissionsByProfileId(profileId: number): Promise<string[]>;
}
