import { Reward } from '../entities/reward.entity';
import { TopReward } from '../entities/tenant-analytics.entity';

/**
 * Interfaz del repositorio de Reward
 * Define el contrato que debe cumplir cualquier implementación
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
   * Busca recompensas por categoría
   */
  findByCategory(tenantId: number, category: string): Promise<Reward[]>;

  /**
   * Busca recompensas disponibles (activas y con stock)
   */
  findAvailable(tenantId: number): Promise<Reward[]>;

  /**
   * Guarda una nueva recompensa
   */
  save(reward: Reward): Promise<Reward>;

  /**
   * Actualiza una recompensa existente
   */
  update(reward: Reward): Promise<Reward>;

  /**
   * Elimina una recompensa por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Obtiene top rewards por número de redemptions
   */
  getTopRewardsByTenantId(tenantId: number, limit: number): Promise<TopReward[]>;
}
