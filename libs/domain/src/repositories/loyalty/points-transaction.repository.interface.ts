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

  /**
   * Obtiene métricas agregadas de un tenant usando queries SQL optimizadas
   * @param tenantId ID del tenant
   */
  getTenantMetrics(tenantId: number): Promise<{
    totalRedemptions: number;
    pointsEarned: number;
    pointsRedeemed: number;
    topRewards: Array<{ ruleId: number; pointsAwarded: number; transactionsCount: number }>;
  }>;

  /**
   * Obtiene las transacciones más recientes de un tenant usando JOIN optimizado
   * @param tenantId ID del tenant
   * @param limit Número máximo de transacciones a retornar
   */
  getRecentTransactionsByTenant(tenantId: number, limit: number): Promise<PointsTransaction[]>;

  /**
   * Busca transacciones de un tenant con paginación y filtros usando JOIN optimizado
   * @param tenantId ID del tenant
   * @param filters Filtros opcionales (tipo, fechas, paginación)
   */
  findByTenantIdPaginated(
    tenantId: number,
    filters?: {
      type?: PointsTransaction['type'] | 'all';
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    },
  ): Promise<{ transactions: PointsTransaction[]; total: number }>;

  /**
   * Obtiene actividad diaria agregada de los últimos N días para un tenant
   * Agrupa transacciones por fecha y calcula puntos ganados/canjeados por día
   * @param tenantId ID del tenant
   * @param days Número de días hacia atrás (default: 7)
   */
  getDailyActivityByTenant(
    tenantId: number,
    days?: number,
  ): Promise<Array<{ date: string; pointsEarned: number; pointsRedeemed: number }>>;

  /**
   * Obtiene métricas agregadas de un tenant para un período específico usando queries SQL optimizadas
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   */
  getTenantMetricsByPeriod(
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    pointsEarnedInPeriod: number;
    pointsRedeemedInPeriod: number;
    redemptionsInPeriod: number;
  }>;

  /**
   * Busca múltiples transacciones por idempotency keys (batch query)
   * Optimización para evitar N+1 queries en ProcessLoyaltyEventHandler
   * @param idempotencyKeys Array de idempotency keys
   * @returns Map con key = idempotencyKey, value = PointsTransaction
   */
  findByIdempotencyKeys(idempotencyKeys: string[]): Promise<Map<string, PointsTransaction>>;

  /**
   * Obtiene métricas de revenue agregadas por sucursal para un tenant
   * Usa los nuevos campos amount y currency con índices optimizados
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período (opcional)
   * @param endDate Fecha de fin del período (opcional)
   * @returns Array de métricas por sucursal
   */
  getBranchRevenueMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      branchId: number;
      totalRevenue: number;
      transactionCount: number;
      avgTicket: number;
      currency: string;
    }>
  >;

  /**
   * Obtiene el revenue total de un tenant para un período específico
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período (opcional)
   * @param endDate Fecha de fin del período (opcional)
   * @returns Revenue total y métricas agregadas
   */
  getTenantRevenueMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRevenue: number;
    transactionCount: number;
    avgTicket: number;
    currency: string;
  }>;

  /**
   * Obtiene métricas de revenue para una sucursal específica
   * @param branchId ID de la sucursal
   * @param tenantId ID del tenant (para validación)
   * @param startDate Fecha de inicio del período (opcional)
   * @param endDate Fecha de fin del período (opcional)
   * @returns Métricas de la sucursal
   */
  getBranchRevenue(
    branchId: number,
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRevenue: number;
    transactionCount: number;
    avgTicket: number;
    currency: string;
  }>;

  /**
   * Obtiene métricas de clientes por sucursal
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período (opcional, para activeCustomers)
   * @param endDate Fecha de fin del período (opcional, para activeCustomers)
   * @returns Métricas de clientes por sucursal
   */
  getBranchCustomerMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      branchId: number;
      totalCustomers: number; // COUNT DISTINCT membershipId (all time)
      activeCustomers: number; // COUNT DISTINCT membershipId (in period)
    }>
  >;

  /**
   * Obtiene métricas de redemptions por sucursal
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   * @returns Número de redemptions por sucursal
   */
  getBranchRedemptionMetrics(
    tenantId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      branchId: number;
      rewardsRedeemed: number;
    }>
  >;

  /**
   * Calcula la tasa de retorno para un tenant en un período
   * Return rate = (clientes con >=2 transacciones / total clientes con >=1 transacción) * 100
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   * @returns Tasa de retorno como porcentaje
   */
  calculateReturnRate(tenantId: number, startDate: Date, endDate: Date): Promise<number>;

  /**
   * Obtiene datos agregados por cliente para segmentación
   * Cuenta transacciones, suma revenue y puntos ganados por membershipId
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   * @returns Array de datos agregados por cliente
   */
  getCustomerDataForSegmentation(
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<
    Array<{
      membershipId: number;
      transactionCount: number;
      totalRevenue: number;
      totalPoints: number;
    }>
  >;

  /**
   * Obtiene revenue generado por clientes que canjearon una recompensa específica
   * @param ruleId ID de la reward rule
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   * @returns Revenue total generado por esos clientes
   */
  getRevenueByReward(
    ruleId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  /**
   * Obtiene el segmento de cliente que más canjea una recompensa
   * @param ruleId ID de la reward rule
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   * @returns Segmento top (VIP, FREQUENT, OCCASIONAL, AT_RISK)
   */
  getTopSegmentByReward(
    ruleId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<string>;

  /**
   * Obtiene la sucursal donde más se canjea una recompensa
   * @param ruleId ID de la reward rule
   * @param tenantId ID del tenant
   * @param startDate Fecha de inicio del período
   * @param endDate Fecha de fin del período
   * @returns ID y nombre de la sucursal top
   */
  getTopBranchByReward(
    ruleId: number,
    tenantId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<{ branchId: number; branchName: string } | null>;
}
