import { Goal } from '../entities/goal.entity';

/**
 * Interfaz del repositorio de Goal
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IGoalRepository {
  /**
   * Busca una meta por su ID
   */
  findById(id: number): Promise<Goal | null>;

  /**
   * Busca todas las metas
   */
  findAll(activeOnly?: boolean): Promise<Goal[]>;

  /**
   * Guarda una nueva meta
   */
  save(goal: Goal): Promise<Goal>;

  /**
   * Actualiza una meta existente
   */
  update(goal: Goal): Promise<Goal>;

  /**
   * Elimina una meta
   */
  delete(id: number): Promise<void>;
}

