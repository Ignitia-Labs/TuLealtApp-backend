import { InvitationCode } from '../entities/invitation-code.entity';

/**
 * Interfaz del repositorio de InvitationCode
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IInvitationCodeRepository {
  /**
   * Busca un código por su ID
   */
  findById(id: number): Promise<InvitationCode | null>;

  /**
   * Busca un código por su valor
   */
  findByCode(code: string): Promise<InvitationCode | null>;

  /**
   * Busca todos los códigos de un tenant
   */
  findByTenantId(tenantId: number): Promise<InvitationCode[]>;

  /**
   * Busca códigos activos de un tenant
   */
  findActiveByTenantId(tenantId: number): Promise<InvitationCode[]>;

  /**
   * Guarda un nuevo código
   */
  save(code: InvitationCode): Promise<InvitationCode>;

  /**
   * Actualiza un código existente
   */
  update(code: InvitationCode): Promise<InvitationCode>;

  /**
   * Elimina un código por su ID
   */
  delete(id: number): Promise<void>;
}
