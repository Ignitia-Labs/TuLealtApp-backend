import { Tenant } from '../entities/tenant.entity';

/**
 * Interfaz del repositorio de Tenant
 * Define los contratos para persistir y recuperar tenants
 */
export interface ITenantRepository {
  /**
   * Guarda un nuevo tenant o actualiza uno existente
   */
  save(tenant: Tenant): Promise<Tenant>;

  /**
   * Actualiza un tenant existente
   */
  update(tenant: Tenant): Promise<Tenant>;

  /**
   * Busca un tenant por su ID
   */
  findById(id: number): Promise<Tenant | null>;

  /**
   * Busca todos los tenants de un partner
   */
  findByPartnerId(partnerId: number): Promise<Tenant[]>;

  /**
   * Obtiene todos los tenants
   */
  findAll(): Promise<Tenant[]>;
}
