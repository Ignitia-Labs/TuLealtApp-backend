import { TierBenefit } from '@libs/domain/entities/tier/tier-benefit.entity';

/**
 * Interfaz del repositorio para TierBenefit
 * Define los métodos que debe implementar cualquier repositorio de TierBenefit
 */
export interface ITierBenefitRepository {
  /**
   * Buscar beneficio por ID
   */
  findById(id: number): Promise<TierBenefit | null>;

  /**
   * Buscar beneficios activos por programa y tier
   */
  findByProgramIdAndTierId(programId: number, tierId: number): Promise<TierBenefit | null>;

  /**
   * Buscar todos los beneficios activos de un programa
   */
  findActiveByProgramId(programId: number): Promise<TierBenefit[]>;

  /**
   * Buscar todos los beneficios activos de un tier
   */
  findActiveByTierId(tierId: number): Promise<TierBenefit[]>;

  /**
   * Guardar beneficio (crear o actualizar)
   */
  save(benefit: TierBenefit): Promise<TierBenefit>;

  /**
   * Eliminar beneficio
   */
  delete(id: number): Promise<void>;
}
