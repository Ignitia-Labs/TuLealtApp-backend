import { RedemptionCode } from '../entities/redemption-code.entity';

/**
 * Interfaz del repositorio para RedemptionCode
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IRedemptionCodeRepository {
  /**
   * Busca un código por su ID
   */
  findById(id: number): Promise<RedemptionCode | null>;

  /**
   * Busca un código por su código único
   */
  findByCode(code: string): Promise<RedemptionCode | null>;

  /**
   * Busca un código por el ID de la transacción asociada
   */
  findByTransactionId(transactionId: number): Promise<RedemptionCode | null>;

  /**
   * Busca todos los códigos de una membership
   */
  findByMembershipId(membershipId: number): Promise<RedemptionCode[]>;

  /**
   * Busca códigos de una membership con filtros opcionales
   */
  findByMembershipIdAndStatus(
    membershipId: number,
    status: 'pending' | 'used' | 'expired' | 'cancelled',
  ): Promise<RedemptionCode[]>;

  /**
   * Guarda un nuevo código de canje
   */
  save(code: RedemptionCode): Promise<RedemptionCode>;

  /**
   * Actualiza un código de canje existente
   */
  update(code: RedemptionCode): Promise<RedemptionCode>;

  /**
   * Verifica si un código existe (por código único)
   */
  existsByCode(code: string): Promise<boolean>;
}
