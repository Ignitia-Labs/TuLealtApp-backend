import { CustomerTier } from '../entities/customer-tier.entity';

/**
 * Interfaz del repositorio de CustomerTier
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ICustomerTierRepository {
  /**
   * Busca un tier por su ID
   */
  findById(id: number): Promise<CustomerTier | null>;

  /**
   * Busca todos los tiers de un tenant
   */
  findByTenantId(tenantId: number): Promise<CustomerTier[]>;

  /**
   * Busca tiers activos de un tenant
   */
  findActiveByTenantId(tenantId: number): Promise<CustomerTier[]>;

  /**
   * Busca el tier correspondiente a un número de puntos
   */
  findByPoints(tenantId: number, points: number): Promise<CustomerTier | null>;

  /**
   * Guarda un nuevo tier
   */
  save(tier: CustomerTier): Promise<CustomerTier>;

  /**
   * Actualiza un tier existente
   */
  update(tier: CustomerTier): Promise<CustomerTier>;

  /**
   * Elimina un tier por su ID
   */
  delete(id: number): Promise<void>;
}
