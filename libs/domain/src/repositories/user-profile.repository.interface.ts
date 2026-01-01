import { UserProfile } from '../entities/user-profile.entity';

/**
 * Interfaz del repositorio de asignaciones usuario-perfil
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IUserProfileRepository {
  /**
   * Busca una asignación por su ID
   */
  findById(id: number): Promise<UserProfile | null>;

  /**
   * Busca todas las asignaciones de un usuario (activas e inactivas)
   */
  findByUserId(userId: number): Promise<UserProfile[]>;

  /**
   * Busca todas las asignaciones de un perfil
   * Útil para ver qué usuarios tienen un perfil específico asignado
   */
  findByProfileId(profileId: number): Promise<UserProfile[]>;

  /**
   * Busca una asignación específica por userId y profileId
   * Útil para verificar si un usuario ya tiene un perfil asignado
   */
  findByUserIdAndProfileId(userId: number, profileId: number): Promise<UserProfile | null>;

  /**
   * Guarda una nueva asignación
   */
  save(userProfile: UserProfile): Promise<UserProfile>;

  /**
   * Actualiza una asignación existente
   */
  update(userProfile: UserProfile): Promise<UserProfile>;

  /**
   * Elimina una asignación por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Busca solo las asignaciones activas de un usuario
   * Útil para obtener los perfiles que actualmente están activos para un usuario
   */
  findActiveByUserId(userId: number): Promise<UserProfile[]>;
}

