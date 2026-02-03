import { PricingPlan } from '@libs/domain/entities/billing/pricing-plan.entity';

/**
 * Interfaz del repositorio de planes de precios
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IPricingPlanRepository {
  /**
   * Busca un plan de precios por su ID
   */
  findById(id: number): Promise<PricingPlan | null>;

  /**
   * Busca un plan de precios por su slug
   */
  findBySlug(slug: string): Promise<PricingPlan | null>;

  /**
   * Busca todos los planes de precios (con filtro de estado opcional)
   */
  findAll(includeInactive?: boolean): Promise<PricingPlan[]>;

  /**
   * Guarda un nuevo plan de precios
   */
  save(plan: PricingPlan): Promise<PricingPlan>;

  /**
   * Actualiza un plan de precios existente
   */
  update(plan: PricingPlan): Promise<PricingPlan>;

  /**
   * Elimina un plan de precios por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Cuenta el total de planes de precios
   */
  count(): Promise<number>;
}
