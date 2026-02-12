import { RefreshToken } from '@libs/domain/entities/auth/refresh-token.entity';

/**
 * Interfaz del repositorio de refresh tokens
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IRefreshTokenRepository {
  /**
   * Busca un refresh token por su hash
   * @param tokenHash Hash del token a buscar
   * @returns RefreshToken si existe, null si no existe
   */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Busca todos los refresh tokens activos de un usuario
   * (no revocados y no expirados)
   * @param userId ID del usuario
   * @returns Array de RefreshToken activos
   */
  findActiveByUserId(userId: number): Promise<RefreshToken[]>;

  /**
   * Busca todos los refresh tokens de un usuario (activos e inactivos)
   * @param userId ID del usuario
   * @returns Array de RefreshToken
   */
  findAllByUserId(userId: number): Promise<RefreshToken[]>;

  /**
   * Guarda un nuevo refresh token
   * @param refreshToken RefreshToken a guardar
   * @returns RefreshToken guardado con ID asignado
   */
  save(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Actualiza un refresh token existente
   * (Usado principalmente para revocar tokens)
   * @param refreshToken RefreshToken a actualizar
   * @returns RefreshToken actualizado
   */
  update(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Revoca un refresh token por su hash
   * @param tokenHash Hash del token a revocar
   * @returns void
   */
  revokeByTokenHash(tokenHash: string): Promise<void>;

  /**
   * Revoca todos los refresh tokens de un usuario
   * (Útil para logout global de todos los dispositivos)
   * @param userId ID del usuario
   * @returns Número de tokens revocados
   */
  revokeAllByUserId(userId: number): Promise<number>;

  /**
   * Elimina refresh tokens expirados de la base de datos
   * (Cleanup job que se ejecuta periódicamente)
   * @returns Número de tokens eliminados
   */
  deleteExpired(): Promise<number>;

  /**
   * Cuenta el número de refresh tokens activos de un usuario
   * @param userId ID del usuario
   * @returns Número de tokens activos
   */
  countActiveByUserId(userId: number): Promise<number>;

  /**
   * Elimina los tokens más antiguos de un usuario si excede el límite
   * @param userId ID del usuario
   * @param maxTokens Número máximo de tokens permitidos
   * @returns Número de tokens eliminados
   */
  deleteOldestIfExceedsLimit(userId: number, maxTokens: number): Promise<number>;
}
