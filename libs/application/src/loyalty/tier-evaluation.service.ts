import { Injectable, Inject } from '@nestjs/common';
import {
  TierPolicy,
  TierStatus,
  CustomerTier,
  IPointsTransactionRepository,
  ICustomerTierRepository,
  ITierPolicyRepository,
  ITierStatusRepository,
  EvaluationWindow,
} from '@libs/domain';

/**
 * Métricas calculadas desde el ledger para evaluación de tier
 */
export interface TierMetrics {
  totalPoints: number; // Total de puntos en el periodo
  totalEarnings: number; // Total de ganancias (transacciones positivas)
  totalSpent: number; // Total gastado (para calcular puntos por compra)
  transactionCount: number; // Número de transacciones
  averagePointsPerTransaction: number; // Promedio de puntos por transacción
}

/**
 * Resultado de evaluación de tier
 */
export interface TierEvaluationResult {
  currentTierId: number | null;
  recommendedTierId: number | null;
  shouldUpgrade: boolean;
  shouldDowngrade: boolean;
  reason: string;
  metrics: TierMetrics;
}

/**
 * Servicio para evaluar tiers de miembros según políticas configurables
 * Calcula métricas desde el ledger y determina si debe hacer upgrade/downgrade
 */
@Injectable()
export class TierEvaluationService {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('ITierPolicyRepository')
    private readonly policyRepository: ITierPolicyRepository,
    @Inject('ITierStatusRepository')
    private readonly statusRepository: ITierStatusRepository,
  ) {}

  /**
   * Evaluar tier de un membership según la política activa del tenant
   */
  async evaluateTier(membershipId: number, tenantId: number): Promise<TierEvaluationResult> {
    // 1. Obtener política activa del tenant
    const policy = await this.policyRepository.findActiveByTenantId(tenantId);
    if (!policy) {
      throw new Error(`No active tier policy found for tenant ${tenantId}`);
    }

    return this.evaluateTierWithPolicy(membershipId, policy);
  }

  /**
   * Evaluar tier con una política específica
   */
  async evaluateTierWithPolicy(
    membershipId: number,
    policy: TierPolicy,
  ): Promise<TierEvaluationResult> {
    // 1. Obtener estado actual del tier
    const currentStatus = await this.statusRepository.findByMembershipId(membershipId);

    // 2. Calcular métricas desde el ledger según la ventana de evaluación
    const metrics = await this.calculateMetrics(membershipId, policy.evaluationWindow);

    // 3. Obtener todos los tiers activos del tenant ordenados por puntos
    const tiers = await this.tierRepository.findByTenantId(policy.tenantId);
    const activeTiers = tiers.filter((t) => t.isActive()).sort((a, b) => a.priority - b.priority);

    // 4. Determinar tier recomendado según métricas y thresholds
    const recommendedTierId = this.determineRecommendedTier(
      metrics.totalPoints,
      policy,
      activeTiers,
    );

    // 5. Verificar si debe hacer upgrade o downgrade
    const currentTierId = currentStatus?.currentTierId ?? null;
    const shouldUpgrade = this.shouldUpgrade(
      currentTierId,
      recommendedTierId,
      currentStatus,
      policy,
    );
    const shouldDowngrade = this.shouldDowngrade(
      currentTierId,
      recommendedTierId,
      currentStatus,
      policy,
    );

    // 6. Generar razón
    const reason = this.generateReason(
      currentTierId,
      recommendedTierId,
      shouldUpgrade,
      shouldDowngrade,
      metrics,
    );

    return {
      currentTierId,
      recommendedTierId,
      shouldUpgrade,
      shouldDowngrade,
      reason,
      metrics,
    };
  }

  /**
   * Calcular métricas desde el ledger según la ventana de evaluación
   */
  async calculateMetrics(membershipId: number, window: EvaluationWindow): Promise<TierMetrics> {
    const now = new Date();
    let startDate: Date;

    switch (window) {
      case 'MONTHLY':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'QUARTERLY':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'ROLLING_30':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'ROLLING_90':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error(`Unknown evaluation window: ${window}`);
    }

    // Obtener transacciones desde la fecha de inicio
    const transactions = await this.pointsTransactionRepository.findForTierEvaluation(
      membershipId,
      startDate,
      now,
    );

    // Calcular métricas
    const totalPoints = transactions.reduce((sum, t) => sum + t.pointsDelta, 0);
    const totalEarnings = transactions
      .filter((t) => t.pointsDelta > 0)
      .reduce((sum, t) => sum + t.pointsDelta, 0);
    const totalSpent = transactions
      .filter((t) => t.type === 'EARNING' && t.metadata?.amount)
      .reduce((sum, t) => sum + (t.metadata?.amount || 0), 0);
    const transactionCount = transactions.length;
    const averagePointsPerTransaction = transactionCount > 0 ? totalPoints / transactionCount : 0;

    return {
      totalPoints,
      totalEarnings,
      totalSpent,
      transactionCount,
      averagePointsPerTransaction,
    };
  }

  /**
   * Determinar tier recomendado según puntos y thresholds
   */
  private determineRecommendedTier(
    totalPoints: number,
    policy: TierPolicy,
    tiers: CustomerTier[],
  ): number | null {
    // Obtener tiers ordenados por puntos mínimos (de menor a mayor)
    const tiersOrdered = policy.getTiersOrderedByPoints();

    // Encontrar el tier más alto que el usuario califica
    let recommendedTierId: number | null = null;

    for (const tierId of tiersOrdered.reverse()) {
      // Verificar si el tier existe en la lista de tiers activos
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier || !tier.isActive()) {
        continue;
      }

      // Verificar si el usuario califica para este tier según los thresholds de la política
      const minPoints = policy.getMinPointsForTier(tierId);
      if (minPoints !== null && totalPoints >= minPoints) {
        recommendedTierId = tierId;
        break; // Tomar el tier más alto que califica
      }
    }

    return recommendedTierId;
  }

  /**
   * Determinar si debe hacer upgrade
   */
  private shouldUpgrade(
    currentTierId: number | null,
    recommendedTierId: number | null,
    currentStatus: TierStatus | null,
    policy: TierPolicy,
  ): boolean {
    if (!recommendedTierId) {
      return false; // No hay tier recomendado
    }

    if (!currentTierId) {
      return true; // No tiene tier, debe asignar uno
    }

    if (currentTierId === recommendedTierId) {
      return false; // Ya está en el tier recomendado
    }

    // Verificar si el tier recomendado es mayor (más puntos requeridos)
    const currentMinPoints = policy.getMinPointsForTier(currentTierId);
    const recommendedMinPoints = policy.getMinPointsForTier(recommendedTierId);

    if (currentMinPoints === null || recommendedMinPoints === null) {
      return false; // No se puede determinar
    }

    const isHigherTier = recommendedMinPoints > currentMinPoints;
    if (!isHigherTier) {
      return false; // No es un upgrade
    }

    // Verificar duración mínima en tier actual
    if (currentStatus && policy.minTierDuration > 0) {
      const daysInTier = currentStatus.daysInCurrentTier();
      if (daysInTier < policy.minTierDuration) {
        return false; // No ha cumplido la duración mínima
      }
    }

    return true;
  }

  /**
   * Determinar si debe hacer downgrade
   */
  private shouldDowngrade(
    currentTierId: number | null,
    recommendedTierId: number | null,
    currentStatus: TierStatus | null,
    policy: TierPolicy,
  ): boolean {
    if (!policy.allowsDowngrade()) {
      return false; // La política no permite downgrades
    }

    if (!currentTierId) {
      return false; // No tiene tier actual
    }

    if (!recommendedTierId) {
      // No califica para ningún tier, pero verificar grace period
      if (policy.usesGracePeriod() && currentStatus?.isInGracePeriod()) {
        return false; // Está en grace period
      }
      return true; // Debe hacer downgrade a null
    }

    if (currentTierId === recommendedTierId) {
      return false; // Ya está en el tier recomendado
    }

    // Verificar si el tier recomendado es menor (menos puntos requeridos)
    const currentMinPoints = policy.getMinPointsForTier(currentTierId);
    const recommendedMinPoints = policy.getMinPointsForTier(recommendedTierId);

    if (currentMinPoints === null || recommendedMinPoints === null) {
      return false; // No se puede determinar
    }

    const isLowerTier = recommendedMinPoints < currentMinPoints;
    if (!isLowerTier) {
      return false; // No es un downgrade
    }

    // Verificar grace period
    if (policy.usesGracePeriod() && currentStatus?.isInGracePeriod()) {
      return false; // Está en grace period, no hacer downgrade aún
    }

    return true;
  }

  /**
   * Generar razón para el cambio de tier
   */
  private generateReason(
    currentTierId: number | null,
    recommendedTierId: number | null,
    shouldUpgrade: boolean,
    shouldDowngrade: boolean,
    metrics: TierMetrics,
  ): string {
    if (shouldUpgrade) {
      return `Upgrade recommended: ${metrics.totalPoints} points qualify for tier ${recommendedTierId}`;
    }

    if (shouldDowngrade) {
      if (recommendedTierId === null) {
        return `Downgrade recommended: ${metrics.totalPoints} points do not qualify for any tier`;
      }
      return `Downgrade recommended: ${metrics.totalPoints} points qualify for tier ${recommendedTierId} (lower than current)`;
    }

    if (currentTierId === null && recommendedTierId) {
      return `Initial tier assignment: ${metrics.totalPoints} points qualify for tier ${recommendedTierId}`;
    }

    return `No change needed: ${metrics.totalPoints} points maintain current tier ${currentTierId}`;
  }
}
