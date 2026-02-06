import { LoyaltyProgram } from '@libs/domain/entities/loyalty/loyalty-program.entity';

/**
 * Interfaz del repositorio de LoyaltyProgram
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface ILoyaltyProgramRepository {
  /**
   * Guarda un nuevo programa de lealtad o actualiza uno existente
   */
  save(program: LoyaltyProgram): Promise<LoyaltyProgram>;

  /**
   * Busca un programa por su ID
   */
  findById(id: number): Promise<LoyaltyProgram | null>;

  /**
   * Busca todos los programas de un tenant
   */
  findByTenantId(tenantId: number): Promise<LoyaltyProgram[]>;

  /**
   * Busca programas activos de un tenant
   */
  findActiveByTenantId(tenantId: number): Promise<LoyaltyProgram[]>;

  /**
   * Busca programas por tipo en un tenant
   */
  findByTenantIdAndType(
    tenantId: number,
    programType: LoyaltyProgram['programType'],
  ): Promise<LoyaltyProgram[]>;

  /**
   * Busca el programa BASE activo de un tenant
   * Debe existir exactamente 1 programa BASE activo por tenant
   */
  findBaseProgramByTenantId(tenantId: number): Promise<LoyaltyProgram | null>;

  /**
   * Busca programas activos que tienen un dominio de earning específico
   */
  findByTenantIdAndEarningDomain(
    tenantId: number,
    earningDomain: string,
  ): Promise<LoyaltyProgram[]>;

  /**
   * Verifica si existe un programa BASE activo para un tenant
   */
  hasActiveBaseProgram(tenantId: number): Promise<boolean>;

  /**
   * Cuenta programas activos de un tenant
   */
  countActiveByTenantId(tenantId: number): Promise<number>;

  /**
   * Elimina un programa por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Busca múltiples programas por sus IDs (batch query)
   * Optimización para evitar N+1 queries
   * @param ids Array de IDs de programas
   */
  findByIds(ids: number[]): Promise<LoyaltyProgram[]>;
}
