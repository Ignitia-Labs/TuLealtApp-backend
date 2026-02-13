import { Injectable, Inject, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(TierChangeService.name);

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
   *
   * Si existe TierPolicy: usa evaluación completa con grace periods y políticas
   * Si NO existe TierPolicy: usa evaluación simplificada basada solo en puntos
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

    this.logger.debug(
      `Evaluating tier change for membership ${membershipId} (current points: ${membership.points}, current tier: ${membership.tierId})`,
    );

    // 2. Verificar si existe política activa
    const policy = await this.policyRepository.findActiveByTenantId(tenantId);

    if (!policy) {
      // FALLBACK: Evaluación simplificada sin política
      this.logger.debug(`No TierPolicy found for tenant ${tenantId}, using simple evaluation`);
      return this.evaluateAndApplyTierChangeSimple(membership, tenantId);
    }

    this.logger.debug(
      `Using TierPolicy ${policy.id} for evaluation (window: ${policy.evaluationWindow})`,
    );

    // 3. Evaluar tier con política completa
    const evaluation = await this.evaluationService.evaluateTier(membershipId, tenantId);

    // 4. Aplicar cambios según evaluación
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
    const currentStatus = await this.statusRepository.findByMembershipId(membershipId);

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

    const currentStatus = await this.statusRepository.findByMembershipId(membershipId);
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

    const currentStatus = await this.statusRepository.findByMembershipId(membershipId);
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

  /**
   * Evaluación simplificada de tier SIN TierPolicy configurado
   * Basado solo en puntos actuales y rangos de customer_tiers
   *
   * Este método es un FALLBACK para que el sistema funcione incluso
   * si no se ha configurado un TierPolicy todavía.
   */
  private async evaluateAndApplyTierChangeSimple(
    membership: CustomerMembership,
    tenantId: number,
  ): Promise<TierChangeResult> {
    this.logger.debug(
      `Simple tier evaluation for membership ${membership.id} (points: ${membership.points})`,
    );

    // 1. Obtener tiers activos del tenant ordenados por prioridad
    const tiers = await this.tierRepository.findByTenantId(tenantId);
    const activeTiers = tiers.filter((t) => t.isActive()).sort((a, b) => b.priority - a.priority); // Mayor prioridad primero

    if (activeTiers.length === 0) {
      this.logger.warn(`No active tiers found for tenant ${tenantId}`);
      throw new Error(`No active tiers found for tenant ${tenantId}`);
    }

    this.logger.debug(
      `Found ${activeTiers.length} active tiers: ${activeTiers.map((t) => `${t.name} (${t.minPoints}-${t.maxPoints ?? '∞'})`).join(', ')}`,
    );

    // 2. Obtener puntos y tier actuales
    const currentPoints = membership.points;
    const currentTierId = membership.tierId;

    // 3. Encontrar tier correcto basado en puntos
    const correctTier = activeTiers.find((tier) => {
      const meetsMin = currentPoints >= tier.minPoints;
      const meetsMax = tier.maxPoints === null || currentPoints <= tier.maxPoints;
      return meetsMin && meetsMax;
    });

    const newTierId = correctTier?.id ?? null;

    this.logger.debug(
      `Tier calculation: ${currentPoints} points → Tier ${newTierId} (${correctTier?.name || 'None'})`,
    );

    // 4. Verificar si hay cambio
    if (currentTierId === newTierId) {
      this.logger.debug(`No tier change needed: tier ${currentTierId} is correct`);
      return {
        membershipId: membership.id,
        previousTierId: currentTierId,
        newTierId: currentTierId,
        changeType: 'no_change',
        status: null as any, // No hay TierStatus sin TierPolicy
        reason: `No change: ${currentPoints} points maintain tier ${currentTierId} (${correctTier?.name || 'N/A'})`,
      };
    }

    // 5. Aplicar cambio de tier en membership
    this.logger.log(
      `Applying tier change for membership ${membership.id}: ${currentTierId} → ${newTierId} (${currentPoints} points)`,
    );

    const updatedMembership = membership.updateTier(newTierId);
    await this.membershipRepository.update(updatedMembership);

    // 6. Determinar tipo de cambio
    let changeType: 'upgrade' | 'downgrade' | 'initial_assignment';
    if (currentTierId === null) {
      changeType = 'initial_assignment';
    } else if (newTierId === null) {
      changeType = 'downgrade';
    } else {
      const currentTier = tiers.find((t) => t.id === currentTierId);
      const newTier = tiers.find((t) => t.id === newTierId);
      changeType =
        newTier && currentTier && newTier.priority > currentTier.priority ? 'upgrade' : 'downgrade';
    }

    // 7. Generar razón
    const oldTierName = currentTierId
      ? tiers.find((t) => t.id === currentTierId)?.name || 'Unknown'
      : 'None';
    const newTierName = correctTier?.name || 'None';

    this.logger.log(
      `Tier change applied successfully: ${oldTierName} → ${newTierName} (${changeType})`,
    );

    return {
      membershipId: membership.id,
      previousTierId: currentTierId,
      newTierId: newTierId,
      changeType,
      status: null as any, // No hay TierStatus sin TierPolicy
      reason: `Tier changed: ${oldTierName} → ${newTierName} (${currentPoints} points, simple evaluation)`,
    };
  }
}
