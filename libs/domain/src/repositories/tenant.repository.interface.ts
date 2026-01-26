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

  /**
   * Elimina un tenant por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Busca un tenant por su código de búsqueda rápida
   */
  findByQuickSearchCode(code: string): Promise<Tenant | null>;
}
