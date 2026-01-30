import { CustomerMembership } from '../entities/customer-membership.entity';
import { TopCustomer } from '../entities/tenant-analytics.entity';

/**
 * Interfaz del repositorio de CustomerMembership
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface ICustomerMembershipRepository {
  /**
   * Busca una membership por su ID
   */
  findById(id: number): Promise<CustomerMembership | null>;

  /**
   * Busca todas las memberships de un usuario
   */
  findByUserId(userId: number): Promise<CustomerMembership[]>;

  /**
   * Busca todas las memberships activas de un usuario
   */
  findActiveByUserId(userId: number): Promise<CustomerMembership[]>;

  /**
   * Busca todas las memberships de un tenant (todos los customers de un tenant)
   */
  findByTenantId(tenantId: number): Promise<CustomerMembership[]>;

  /**
   * Busca una membership específica por usuario y tenant
   */
  findByUserIdAndTenantId(userId: number, tenantId: number): Promise<CustomerMembership | null>;

  /**
   * Busca una membership por su QR code
   */
  findByQrCode(qrCode: string): Promise<CustomerMembership | null>;

  /**
   * Guarda una nueva membership
   */
  save(membership: CustomerMembership): Promise<CustomerMembership>;

  /**
   * Actualiza una membership existente
   */
  update(membership: CustomerMembership): Promise<CustomerMembership>;

  /**
   * Elimina una membership por su ID
   */
  delete(id: number): Promise<void>;

  /**
   * Cuenta el total de customers (memberships) de un tenant
   */
  countByTenantId(tenantId: number): Promise<number>;

  /**
   * Cuenta customers activos de un tenant
   */
  countByTenantIdAndStatus(tenantId: number, status: 'active' | 'inactive'): Promise<number>;

  /**
   * Busca memberships de un usuario filtradas por status
   */
  findByUserIdAndStatus(
    userId: number,
    status: 'active' | 'inactive',
  ): Promise<CustomerMembership[]>;

  /**
   * Busca memberships de un partner (a través de tenant.partnerId) con paginación
   */
  findCustomersByPartnerIdPaginated(
    partnerId: number,
    page: number,
    limit: number,
    status?: 'active' | 'inactive' | 'suspended',
  ): Promise<{ data: CustomerMembership[]; total: number }>;

  /**
   * Busca todas las memberships de un partner (a través de tenant.partnerId) sin paginación
   */
  findCustomersByPartnerId(
    partnerId: number,
    status?: 'active' | 'inactive' | 'suspended',
  ): Promise<CustomerMembership[]>;

  /**
   * Obtiene top customers por puntos totales
   */
  getTopCustomersByTenantId(tenantId: number, limit: number): Promise<TopCustomer[]>;

  /**
   * Actualiza el balance de una membership desde el ledger
   * Este es el ÚNICO método permitido para actualizar customer_memberships.points
   * El campo points es una proyección calculada desde el ledger, no debe actualizarse directamente
   * @param membershipId ID de la membership
   * @param balance Balance calculado desde el ledger
   * @returns Membership actualizada con el nuevo balance
   */
  updateBalanceFromLedger(membershipId: number, balance: number): Promise<CustomerMembership>;
}
