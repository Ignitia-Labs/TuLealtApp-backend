import { Reward } from '@libs/domain/entities/loyalty/reward.entity';

/**
 * Interfaz del repositorio de Reward
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IRewardRepository {
  /**
   * Busca una recompensa por su ID
   */
  findById(id: number): Promise<Reward | null>;

  /**
   * Busca todas las recompensas de un tenant
   */
  findByTenantId(tenantId: number): Promise<Reward[]>;

  /**
   * Busca recompensas disponibles (activas, con stock, no expiradas) de un tenant
   */
  findAvailableByTenantId(tenantId: number): Promise<Reward[]>;

  /**
   * Busca recompensas por categoría
   */
  findByCategory(tenantId: number, category: string): Promise<Reward[]>;

  /**
   * Guarda una nueva recompensa o actualiza una existente
   */
  save(reward: Reward): Promise<Reward>;

  /**
   * Actualiza una recompensa existente
   */
  update(reward: Reward): Promise<Reward>;

  /**
   * Elimina una recompensa
   */
  delete(id: number): Promise<void>;

  /**
   * Cuenta cuántas veces un usuario ha canjeado una recompensa específica
   * @param rewardId ID de la recompensa
   * @param membershipId ID de la membership del usuario
   */
  countRedemptionsByUser(rewardId: number, membershipId: number): Promise<number>;

  /**
   * Cuenta el total de redemptions globales de una recompensa (todas las memberships)
   * @param rewardId ID de la recompensa
   */
  countTotalRedemptions(rewardId: number): Promise<number>;

  /**
   * Cuenta el total de redemptions globales para múltiples recompensas en batch
   * Retorna un Map con rewardId como clave y el conteo como valor
   * @param rewardIds Array de IDs de recompensas
   */
  countTotalRedemptionsBatch(rewardIds: number[]): Promise<Map<number, number>>;
}
