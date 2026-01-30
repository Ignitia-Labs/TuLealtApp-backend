import { TierStatus } from '../entities/tier-status.entity';

/**
 * Interfaz del repositorio para TierStatus
 * Define los métodos que debe implementar cualquier repositorio de TierStatus
 */
export interface ITierStatusRepository {
  /**
   * Buscar estado por membership ID
   */
  findByMembershipId(membershipId: number): Promise<TierStatus | null>;

  /**
   * Buscar estados que necesitan evaluación (nextEvalAt <= now)
   */
  findPendingEvaluation(now: Date): Promise<TierStatus[]>;

  /**
   * Buscar estados en grace period que están por expirar
   */
  findExpiringGracePeriods(now: Date): Promise<TierStatus[]>;

  /**
   * Guardar estado (crear o actualizar)
   */
  save(status: TierStatus): Promise<TierStatus>;

  /**
   * Eliminar estado
   */
  delete(membershipId: number): Promise<void>;
}
