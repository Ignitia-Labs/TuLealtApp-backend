import { CustomerPartner } from '../entities/customer-partner.entity';

/**
 * Interfaz del repositorio de CustomerPartner
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface ICustomerPartnerRepository {
  /**
   * Busca una asociación por su ID
   */
  findById(id: number): Promise<CustomerPartner | null>;

  /**
   * Guarda una nueva asociación
   */
  save(customerPartner: CustomerPartner): Promise<CustomerPartner>;

  /**
   * Actualiza una asociación existente
   */
  update(customerPartner: CustomerPartner): Promise<CustomerPartner>;

  /**
   * Elimina una asociación por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Busca todas las asociaciones de un customer (usuario)
   */
  findByUserId(userId: number): Promise<CustomerPartner[]>;

  /**
   * Busca todas las asociaciones de un customer con un status específico
   */
  findByUserIdAndStatus(userId: number, status: string): Promise<CustomerPartner[]>;

  /**
   * Busca una asociación específica por customer y partner
   */
  findByUserIdAndPartnerId(userId: number, partnerId: number): Promise<CustomerPartner[]>;

  /**
   * Busca una asociación específica por customer, partner y tenant
   */
  findByUserIdAndPartnerIdAndTenantId(
    userId: number,
    partnerId: number,
    tenantId: number,
  ): Promise<CustomerPartner | null>;

  /**
   * Busca todas las asociaciones de un partner
   */
  findByPartnerId(partnerId: number): Promise<CustomerPartner[]>;

  /**
   * Busca todas las asociaciones de un partner con un status específico
   */
  findByPartnerIdAndStatus(partnerId: number, status: string): Promise<CustomerPartner[]>;

  /**
   * Cuenta el total de customers asociados a un partner
   */
  countByPartnerId(partnerId: number): Promise<number>;

  /**
   * Cuenta el total de customers asociados a un partner con un status específico
   */
  countByPartnerIdAndStatus(partnerId: number, status: string): Promise<number>;

  /**
   * Busca todas las asociaciones de un tenant
   */
  findByTenantId(tenantId: number): Promise<CustomerPartner[]>;

  /**
   * Busca una asociación específica por customer, partner y status
   */
  findByUserIdAndPartnerIdAndStatus(
    userId: number,
    partnerId: number,
    status: string,
  ): Promise<CustomerPartner | null>;

  /**
   * Busca customers de un partner con paginación (para escalabilidad)
   */
  findCustomersByPartnerIdPaginated(
    partnerId: number,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ data: CustomerPartner[]; total: number }>;

  /**
   * Busca partners de un customer con paginación (para escalabilidad)
   */
  findPartnersByUserIdPaginated(
    userId: number,
    page: number,
    limit: number,
    status?: string,
  ): Promise<{ data: CustomerPartner[]; total: number }>;
}
