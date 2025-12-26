import { PointsRule } from '../entities/points-rule.entity';

/**
 * Interfaz del repositorio de PointsRule
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IPointsRuleRepository {
  /**
   * Busca una regla por su ID
   */
  findById(id: number): Promise<PointsRule | null>;

  /**
   * Busca todas las reglas de un tenant
   */
  findByTenantId(tenantId: number): Promise<PointsRule[]>;

  /**
   * Busca reglas activas de un tenant
   */
  findActiveByTenantId(tenantId: number): Promise<PointsRule[]>;

  /**
   * Busca reglas por tipo
   */
  findByType(
    tenantId: number,
    type: 'purchase' | 'birthday' | 'referral' | 'visit' | 'custom',
  ): Promise<PointsRule[]>;

  /**
   * Guarda una nueva regla
   */
  save(rule: PointsRule): Promise<PointsRule>;

  /**
   * Actualiza una regla existente
   */
  update(rule: PointsRule): Promise<PointsRule>;

  /**
   * Elimina una regla por su ID
   */
  delete(id: number): Promise<void>;
}
