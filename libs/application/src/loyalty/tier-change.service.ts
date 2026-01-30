import { Injectable, Inject } from '@nestjs/common';
import {
  TierStatus,
  TierPolicy,
  CustomerMembership,
  ICustomerMembershipRepository,
  ITierStatusRepository,
  ITierPolicyRepository,
  ICustomerTierRepository,
} from '@libs/domain';
import { TierEvaluationService, TierEvaluationResult } from './tier-evaluation.service';

/**
 * Resultado de un cambio de tier
 */
export interface TierChangeResult {
  membershipId: number;
  previousTierId: number | null;
  newTierId: number | null;
  changeType: 'upgrade' | 'downgrade' | 'no_change' | 'initial_assignment';
  status: TierStatus;
  reason: string;
}

/**
 * Servicio para manejar cambios de tier
 * Maneja upgrades inmediatos y downgrades con grace period
 */
@Injectable()
export class TierChangeService {
  constructor(
    private readonly evaluationService: TierEvaluationService,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITierStatusRepository')
    private readonly statusRepository: ITierStatusRepository,
    @Inject('ITierPolicyRepository')
    private readonly policyRepository: ITierPolicyRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
  ) {}

  /**
   * Evaluar y aplicar cambios de tier para un membership
   */
  async evaluateAndApplyTierChange(
    membershipId: number,
    tenantId: number,
  ): Promise<TierChangeResult> {
    // 1. Obtener membership
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    // 2. Evaluar tier
    const evaluation = await this.evaluationService.evaluateTier(membershipId, tenantId);

    // 3. Aplicar cambios según evaluación
    return this.applyTierChange(membershipId, tenantId, evaluation);
  }

  /**
   * Aplicar cambio de tier según resultado de evaluación
   */
  async applyTierChange(
    membershipId: number,
    tenantId: number,
    evaluation: TierEvaluationResult,
  ): Promise<TierChangeResult> {
    // 1. Obtener política activa
    const policy = await this.policyRepository.findActiveByTenantId(tenantId);
    if (!policy) {
      throw new Error(`No active tier policy found for tenant ${tenantId}`);
    }

    // 2. Obtener estado actual
    let currentStatus = await this.statusRepository.findByMembershipId(membershipId);

    // 3. Determinar tipo de cambio y aplicar
    let newStatus: TierStatus;
    let changeType: 'upgrade' | 'downgrade' | 'no_change' | 'initial_assignment';
    const previousTierId = currentStatus?.currentTierId ?? null;

    if (evaluation.shouldUpgrade) {
      // Upgrade inmediato
      const graceUntil = null; // Upgrades no tienen grace period
      const nextEvalAt = this.calculateNextEvaluationDate(policy);
      newStatus = currentStatus
        ? currentStatus.upgrade(evaluation.recommendedTierId!, graceUntil, nextEvalAt)
        : TierStatus.create(
            membershipId,
            evaluation.recommendedTierId!,
            new Date(),
            graceUntil,
            nextEvalAt,
          );
      changeType = previousTierId === null ? 'initial_assignment' : 'upgrade';
    } else if (evaluation.shouldDowngrade) {
      // Downgrade con grace period si aplica
      if (policy.usesGracePeriod() && currentStatus?.isInGracePeriod()) {
        // Ya está en grace period, aplicar downgrade ahora
        const nextEvalAt = this.calculateNextEvaluationDate(policy);
        newStatus = currentStatus.downgrade(evaluation.recommendedTierId, null, nextEvalAt);
        changeType = 'downgrade';
      } else if (policy.usesGracePeriod()) {
        // Iniciar grace period
        const graceUntil = new Date(Date.now() + policy.gracePeriodDays * 24 * 60 * 60 * 1000);
        const nextEvalAt = graceUntil; // Evaluar cuando expire el grace period
        newStatus = currentStatus
          ? currentStatus.updateNextEvalAt(nextEvalAt)
          : TierStatus.create(membershipId, previousTierId, new Date(), graceUntil, nextEvalAt);
        changeType = 'no_change'; // No cambia aún, solo inicia grace period
      } else {
        // Downgrade inmediato (sin grace period)
        const nextEvalAt = this.calculateNextEvaluationDate(policy);
        newStatus = currentStatus
          ? currentStatus.downgrade(evaluation.recommendedTierId, null, nextEvalAt)
          : TierStatus.create(
              membershipId,
              evaluation.recommendedTierId,
              new Date(),
              null,
              nextEvalAt,
            );
        changeType = 'downgrade';
      }
    } else {
      // No hay cambio necesario
      const nextEvalAt = this.calculateNextEvaluationDate(policy);
      newStatus = currentStatus
        ? currentStatus.updateNextEvalAt(nextEvalAt)
        : TierStatus.create(membershipId, previousTierId, new Date(), null, nextEvalAt);
      changeType = 'no_change';
    }

    // 4. Guardar nuevo estado
    const savedStatus = await this.statusRepository.save(newStatus);

    // 5. Actualizar tier en membership si hubo cambio real
    if (
      changeType === 'upgrade' ||
      changeType === 'downgrade' ||
      changeType === 'initial_assignment'
    ) {
      const membership = await this.membershipRepository.findById(membershipId);
      if (membership) {
        const updatedMembership = membership.updateTier(savedStatus.currentTierId);
        await this.membershipRepository.update(updatedMembership);
      }
    }

    return {
      membershipId,
      previousTierId,
      newTierId: savedStatus.currentTierId,
      changeType,
      status: savedStatus,
      reason: evaluation.reason,
    };
  }

  /**
   * Procesar downgrades que están por expirar su grace period
   */
  async processExpiringGracePeriods(tenantId: number): Promise<TierChangeResult[]> {
    const now = new Date();
    const results: TierChangeResult[] = [];

    // 1. Obtener estados con grace period expirando
    const expiringStatuses = await this.statusRepository.findExpiringGracePeriods(now);

    // 2. Procesar cada uno
    for (const status of expiringStatuses) {
      // Verificar que el membership pertenece al tenant
      const membership = await this.membershipRepository.findById(status.membershipId);
      if (!membership || membership.tenantId !== tenantId) {
        continue;
      }

      // Evaluar y aplicar downgrade
      const evaluation = await this.evaluationService.evaluateTier(status.membershipId, tenantId);
      const result = await this.applyTierChange(status.membershipId, tenantId, evaluation);
      results.push(result);
    }

    return results;
  }

  /**
   * Procesar evaluaciones pendientes (nextEvalAt <= now)
   */
  async processPendingEvaluations(tenantId: number): Promise<TierChangeResult[]> {
    const now = new Date();
    const results: TierChangeResult[] = [];

    // 1. Obtener estados pendientes de evaluación
    const pendingStatuses = await this.statusRepository.findPendingEvaluation(now);

    // 2. Procesar cada uno
    for (const status of pendingStatuses) {
      // Verificar que el membership pertenece al tenant
      const membership = await this.membershipRepository.findById(status.membershipId);
      if (!membership || membership.tenantId !== tenantId) {
        continue;
      }

      // Evaluar y aplicar cambios
      const evaluation = await this.evaluationService.evaluateTier(status.membershipId, tenantId);
      const result = await this.applyTierChange(status.membershipId, tenantId, evaluation);
      results.push(result);
    }

    return results;
  }

  /**
   * Calcular fecha de próxima evaluación según la política
   */
  private calculateNextEvaluationDate(policy: TierPolicy): Date {
    const now = new Date();
    let nextEval: Date;

    switch (policy.evaluationWindow) {
      case 'MONTHLY':
        // Próximo mes
        nextEval = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'QUARTERLY':
        // Próximo trimestre
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const nextQuarter = currentQuarter + 1;
        nextEval = new Date(now.getFullYear(), nextQuarter * 3, 1);
        break;
      case 'ROLLING_30':
        // 30 días desde ahora
        nextEval = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'ROLLING_90':
        // 90 días desde ahora
        nextEval = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Por defecto, evaluar en 30 días
        nextEval = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return nextEval;
  }

  /**
   * Forzar upgrade inmediato (útil para ajustes manuales)
   */
  async forceUpgrade(
    membershipId: number,
    newTierId: number,
    tenantId: number,
  ): Promise<TierChangeResult> {
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    const policy = await this.policyRepository.findActiveByTenantId(tenantId);
    if (!policy) {
      throw new Error(`No active tier policy found for tenant ${tenantId}`);
    }

    let currentStatus = await this.statusRepository.findByMembershipId(membershipId);
    const previousTierId = currentStatus?.currentTierId ?? null;

    const nextEvalAt = this.calculateNextEvaluationDate(policy);
    const newStatus = currentStatus
      ? currentStatus.upgrade(newTierId, null, nextEvalAt)
      : TierStatus.create(membershipId, newTierId, new Date(), null, nextEvalAt);

    const savedStatus = await this.statusRepository.save(newStatus);

    // Actualizar membership
    const updatedMembership = membership.updateTier(savedStatus.currentTierId);
    await this.membershipRepository.update(updatedMembership);

    return {
      membershipId,
      previousTierId,
      newTierId: savedStatus.currentTierId,
      changeType: previousTierId === null ? 'initial_assignment' : 'upgrade',
      status: savedStatus,
      reason: `Forced upgrade to tier ${newTierId}`,
    };
  }

  /**
   * Forzar downgrade inmediato (útil para ajustes manuales)
   */
  async forceDowngrade(
    membershipId: number,
    newTierId: number | null,
    tenantId: number,
  ): Promise<TierChangeResult> {
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    const policy = await this.policyRepository.findActiveByTenantId(tenantId);
    if (!policy) {
      throw new Error(`No active tier policy found for tenant ${tenantId}`);
    }

    let currentStatus = await this.statusRepository.findByMembershipId(membershipId);
    const previousTierId = currentStatus?.currentTierId ?? null;

    const nextEvalAt = this.calculateNextEvaluationDate(policy);
    const newStatus = currentStatus
      ? currentStatus.downgrade(newTierId, null, nextEvalAt)
      : TierStatus.create(membershipId, newTierId, new Date(), null, nextEvalAt);

    const savedStatus = await this.statusRepository.save(newStatus);

    // Actualizar membership
    const updatedMembership = membership.updateTier(savedStatus.currentTierId);
    await this.membershipRepository.update(updatedMembership);

    return {
      membershipId,
      previousTierId,
      newTierId: savedStatus.currentTierId,
      changeType: 'downgrade',
      status: savedStatus,
      reason: `Forced downgrade to tier ${newTierId ?? 'none'}`,
    };
  }
}
