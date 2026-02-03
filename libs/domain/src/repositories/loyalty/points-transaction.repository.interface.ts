import { PointsTransaction } from '@libs/domain/entities/loyalty/points-transaction.entity';

/**
 * Interfaz del repositorio de PointsTransaction
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IPointsTransactionRepository {
  /**
   * Guarda una nueva transacción en el ledger
   * El ledger es inmutable, solo se insertan nuevas transacciones
   */
  save(transaction: PointsTransaction): Promise<PointsTransaction>;

  /**
   * Busca una transacción por su ID
   */
  findById(id: number): Promise<PointsTransaction | null>;

  /**
   * Busca una transacción por su idempotencyKey
   * Crítico para garantizar idempotencia
   */
  findByIdempotencyKey(idempotencyKey: string): Promise<PointsTransaction | null>;

  /**
   * Busca todas las transacciones de una membership
   */
  findByMembershipId(membershipId: number): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones de una membership por tipo
   */
  findByMembershipIdAndType(
    membershipId: number,
    type: PointsTransaction['type'],
  ): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones de una membership por tipo y rewardId
   * Útil para contar redemptions de una recompensa específica
   */
  findByMembershipIdAndTypeAndRewardId(
    membershipId: number,
    type: PointsTransaction['type'],
    rewardId: number,
  ): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones por sourceEventId
   * Útil para encontrar todas las transacciones generadas por un evento específico
   */
  findBySourceEventId(sourceEventId: string): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones por correlationId
   * Útil para encontrar transacciones relacionadas
   */
  findByCorrelationId(correlationId: string): Promise<PointsTransaction[]>;

  /**
   * Calcula el balance actual de una membership sumando todos los pointsDelta
   */
  calculateBalance(membershipId: number): Promise<number>;

  /**
   * Calcula el balance de una membership por programa específico
   */
  calculateBalanceByProgram(membershipId: number, programId: number): Promise<number>;

  /**
   * Busca transacciones para evaluación de tier
   * Retorna transacciones dentro de una ventana de tiempo específica
   */
  findForTierEvaluation(
    membershipId: number,
    fromDate: Date,
    toDate: Date,
  ): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones que están próximas a expirar
   */
  findExpiringTransactions(membershipId: number, beforeDate: Date): Promise<PointsTransaction[]>;

  /**
   * Busca la transacción original que fue revertida por una transacción REVERSAL
   */
  findReversedTransaction(reversalTransactionId: number): Promise<PointsTransaction | null>;

  /**
   * Busca todas las reversiones de una transacción específica
   */
  findReversalsOf(transactionId: number): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones de tipo EARNING por membership y periodo
   * Útil para validar límites de frecuencia y caps por periodo
   * @param membershipId ID de la membership
   * @param programId ID del programa (opcional, null para todos los programas)
   * @param ruleId ID de la regla (opcional, null para todas las reglas)
   * @param startDate Fecha de inicio del periodo
   * @param endDate Fecha de fin del periodo
   */
  findEarningsByMembershipAndPeriod(
    membershipId: number,
    programId: number | null,
    ruleId: number | null,
    startDate: Date,
    endDate: Date,
  ): Promise<PointsTransaction[]>;
}
