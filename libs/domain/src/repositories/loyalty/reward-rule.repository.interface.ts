import { RewardRule } from '@libs/domain/entities/loyalty/reward-rule.entity';

/**
 * Interfaz del repositorio de RewardRule
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IRewardRuleRepository {
  /**
   * Guarda una nueva regla de recompensa o actualiza una existente
   */
  save(rule: RewardRule): Promise<RewardRule>;

  /**
   * Busca una regla por su ID
   */
  findById(id: number): Promise<RewardRule | null>;

  /**
   * Busca todas las reglas de un programa
   */
  findByProgramId(programId: number): Promise<RewardRule[]>;

  /**
   * Busca reglas activas de un programa
   */
  findActiveByProgramId(programId: number): Promise<RewardRule[]>;

  /**
   * Busca reglas por trigger en un programa
   */
  findByProgramIdAndTrigger(
    programId: number,
    trigger: RewardRule['trigger'],
  ): Promise<RewardRule[]>;

  /**
   * Busca reglas activas por trigger en un programa
   */
  findActiveByProgramIdAndTrigger(
    programId: number,
    trigger: RewardRule['trigger'],
  ): Promise<RewardRule[]>;

  /**
   * Busca reglas por earning domain en un programa
   */
  findByProgramIdAndEarningDomain(programId: number, earningDomain: string): Promise<RewardRule[]>;

  /**
   * Busca reglas activas por earning domain en un programa
   */
  findActiveByProgramIdAndEarningDomain(
    programId: number,
    earningDomain: string,
  ): Promise<RewardRule[]>;

  /**
   * Busca reglas por conflict group en un programa
   */
  findByProgramIdAndConflictGroup(programId: number, conflictGroup: string): Promise<RewardRule[]>;

  /**
   * Busca reglas activas por conflict group en un programa
   */
  findActiveByProgramIdAndConflictGroup(
    programId: number,
    conflictGroup: string,
  ): Promise<RewardRule[]>;

  /**
   * Busca reglas activas por trigger y earning domain
   */
  findActiveByProgramIdTriggerAndEarningDomain(
    programId: number,
    trigger: RewardRule['trigger'],
    earningDomain: string,
  ): Promise<RewardRule[]>;

  /**
   * Cuenta reglas activas de un programa
   */
  countActiveByProgramId(programId: number): Promise<number>;

  /**
   * Elimina una regla por su ID
   */
  delete(id: number): Promise<void>;
}
