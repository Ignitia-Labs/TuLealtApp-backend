import { Transaction } from '../entities/transaction.entity';

/**
 * Interfaz del repositorio de Transaction
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ITransactionRepository {
  /**
   * Busca una transacción por su ID
   */
  findById(id: number): Promise<Transaction | null>;

  /**
   * Busca todas las transacciones de un usuario
   */
  findByUserId(userId: number, skip?: number, take?: number): Promise<Transaction[]>;

  /**
   * Busca todas las transacciones de una membership
   */
  findByMembershipId(membershipId: number, skip?: number, take?: number): Promise<Transaction[]>;

  /**
   * Busca transacciones por tipo
   */
  findByType(userId: number, type: 'earn' | 'redeem' | 'expire' | 'adjust'): Promise<Transaction[]>;

  /**
   * Busca transacciones por tipo y membership
   */
  findByTypeAndMembershipId(
    membershipId: number,
    type: 'earn' | 'redeem' | 'expire' | 'adjust',
  ): Promise<Transaction[]>;

  /**
   * Guarda una nueva transacción
   */
  save(transaction: Transaction): Promise<Transaction>;

  /**
   * Cuenta el total de transacciones de un usuario
   */
  countByUserId(userId: number): Promise<number>;
}
