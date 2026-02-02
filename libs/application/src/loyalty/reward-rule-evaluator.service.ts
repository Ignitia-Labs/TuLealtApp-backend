import { Injectable, Inject } from '@nestjs/common';
import {
  IRewardRuleRepository,
  RewardRule,
  CustomerMembership,
  CustomerTier,
  LoyaltyEvent,
  RuleEvaluationResult,
  TierBenefit,
  ITierBenefitRepository,
  IPointsTransactionRepository,
} from '@libs/domain';

/**
 * Servicio para evaluar reglas de recompensa contra eventos
 * Filtra reglas por trigger y eligibility, y calcula puntos según la fórmula
 */
@Injectable()
export class RewardRuleEvaluator {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ITierBenefitRepository')
    private readonly tierBenefitRepository: ITierBenefitRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  /**
   * Evalúa reglas activas de un programa para un evento dado
   * @returns Lista de resultados de evaluación (reglas que aplican)
   */
  async evaluateRules(
    programId: number,
    event: LoyaltyEvent,
    membership: CustomerMembership,
    tier: CustomerTier | null,
  ): Promise<RuleEvaluationResult[]> {
    console.log(
      `[RULE_EVAL] Starting evaluation - programId: ${programId}, eventType: ${event.eventType}, membershipId: ${membership.id}, tierId: ${tier?.id || 'null'}`,
    );

    // 1. Obtener reglas activas del programa que coincidan con el trigger
    const rules = await this.ruleRepository.findActiveByProgramIdAndTrigger(
      programId,
      event.eventType,
    );

    console.log(
      `[RULE_EVAL] Found ${rules.length} active rules for trigger ${event.eventType}:`,
      rules.map((r) => ({
        id: r.id,
        name: r.name,
        trigger: r.trigger,
        earningDomain: r.earningDomain,
        scope: r.scope,
      })),
    );

    if (rules.length === 0) {
      console.log(`[RULE_EVAL] No active rules found for trigger ${event.eventType}`);
      return [];
    }

    // 2. Filtrar reglas por eligibility
    const eligibleRules: RewardRule[] = [];
    const ineligibleRules: Array<{ rule: RewardRule; reason: string }> = [];

    for (const rule of rules) {
      const eligibilityResult = this.checkEligibility(rule, event, membership, tier);
      if (eligibilityResult.passed) {
        eligibleRules.push(rule);
      } else {
        ineligibleRules.push({ rule, reason: eligibilityResult.reason });
      }
    }

    console.log(
      `[RULE_EVAL] Eligibility check - Eligible: ${eligibleRules.length}, Ineligible: ${ineligibleRules.length}`,
    );
    if (ineligibleRules.length > 0) {
      console.log(
        `[RULE_EVAL] Ineligible rules:`,
        ineligibleRules.map((ir) => ({
          ruleId: ir.rule.id,
          ruleName: ir.rule.name,
          reason: ir.reason,
        })),
      );
    }

    if (eligibleRules.length === 0) {
      console.log(`[RULE_EVAL] No eligible rules after filtering`);
      return [];
    }

    // 2.5. Filtrar reglas por límites de frecuencia y cooldown
    const rulesPassingLimits: RewardRule[] = [];
    const rulesFailingLimits: Array<{ rule: RewardRule; reason: string }> = [];

    for (const rule of eligibleRules) {
      const limitsResult = await this.checkFrequencyLimits(rule, event, membership.id);
      if (limitsResult.passed) {
        rulesPassingLimits.push(rule);
      } else {
        rulesFailingLimits.push({ rule, reason: limitsResult.reason });
      }
    }

    console.log(
      `[RULE_EVAL] Frequency limits check - Passing: ${rulesPassingLimits.length}, Failing: ${rulesFailingLimits.length}`,
    );
    if (rulesFailingLimits.length > 0) {
      console.log(
        `[RULE_EVAL] Rules failing limits:`,
        rulesFailingLimits.map((rfl) => ({
          ruleId: rfl.rule.id,
          ruleName: rfl.rule.name,
          reason: rfl.reason,
        })),
      );
    }

    if (rulesPassingLimits.length === 0) {
      console.log(`[RULE_EVAL] No rules passing frequency limits`);
      return [];
    }

    // 3. Evaluar cada regla y calcular puntos
    const results: RuleEvaluationResult[] = [];

    // 4. Obtener TierBenefits si hay tier
    let tierBenefit: TierBenefit | null = null;
    if (tier) {
      tierBenefit = await this.tierBenefitRepository.findByProgramIdAndTierId(programId, tier.id);
    }

    console.log(`[RULE_EVAL] Evaluating ${rulesPassingLimits.length} rules for points calculation`);

    for (const rule of rulesPassingLimits) {
      try {
        const basePoints = this.calculatePoints(rule, event, tier);
        console.log(
          `[RULE_EVAL] Rule ${rule.id} (${rule.name}) - Base points: ${basePoints}, Formula: ${rule.pointsFormula.type}`,
        );

        let points = basePoints;

        // Aplicar TierBenefits si existe
        if (tierBenefit && tierBenefit.isActive()) {
          const beforeMultiplier = points;
          points = tierBenefit.applyMultiplier(points);
          console.log(
            `[RULE_EVAL] Rule ${rule.id} - Tier benefit applied: ${beforeMultiplier} -> ${points} (multiplier: ${tierBenefit.pointsMultiplier})`,
          );
        }

        if (points > 0) {
          const evaluation = {
            ruleId: rule.id,
            programId: rule.programId,
            conflictGroup: rule.conflict.conflictGroup,
            stackPolicy: rule.conflict.stackPolicy,
            priorityRank: rule.conflict.priorityRank,
            points,
            earningDomain: rule.earningDomain,
            idempotencyKey: '', // Se generará después por IdempotencyKeyGenerator
            reasonCode: rule.earningDomain,
            metadata: {
              ruleName: rule.name,
              formulaType: rule.pointsFormula.type,
              tierBenefitApplied: tierBenefit ? tierBenefit.pointsMultiplier : null,
            },
          };
          results.push(evaluation);
          console.log(`[RULE_EVAL] Rule ${rule.id} - Evaluation added:`, evaluation);
        } else {
          console.log(`[RULE_EVAL] Rule ${rule.id} - Points <= 0, skipping`);
        }
      } catch (error) {
        // Log error pero continuar con otras reglas
        console.error(`[RULE_EVAL] Error evaluating rule ${rule.id}:`, error);
      }
    }

    console.log(`[RULE_EVAL] Evaluation complete - ${results.length} evaluations returned`);
    return results;
  }

  /**
   * Verifica si una regla es elegible para el evento dado
   */
  private checkEligibility(
    rule: RewardRule,
    event: LoyaltyEvent,
    membership: CustomerMembership,
    tier: CustomerTier | null,
  ): { passed: boolean; reason?: string } {
    const eligibility = rule.eligibility;

    // Verificar condiciones de membership
    // Solo validar si membershipStatus está definido Y tiene elementos
    // Si está vacío o es null/undefined, no aplicar restricción
    if (eligibility.membershipStatus && eligibility.membershipStatus.length > 0) {
      if (!eligibility.membershipStatus.includes(membership.status)) {
        return {
          passed: false,
          reason: `Membership status '${membership.status}' not in allowed statuses: ${eligibility.membershipStatus.join(', ')}`,
        };
      }
    }

    // Verificar tier
    if (eligibility.minTierId !== null && eligibility.minTierId !== undefined) {
      if (!tier || tier.priority < eligibility.minTierId) {
        return {
          passed: false,
          reason: `Tier requirement not met: minTierId=${eligibility.minTierId}, currentTierPriority=${tier?.priority || 'null'}`,
        };
      }
    }
    if (eligibility.maxTierId !== null && eligibility.maxTierId !== undefined) {
      if (tier && tier.priority > eligibility.maxTierId) {
        return {
          passed: false,
          reason: `Tier requirement not met: maxTierId=${eligibility.maxTierId}, currentTierPriority=${tier.priority}`,
        };
      }
    }

    // Verificar antigüedad de membership
    if (
      eligibility.minMembershipAgeDays !== null &&
      eligibility.minMembershipAgeDays !== undefined
    ) {
      const membershipAgeDays = Math.floor(
        (Date.now() - membership.joinedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (membershipAgeDays < eligibility.minMembershipAgeDays) {
        return {
          passed: false,
          reason: `Membership age requirement not met: minAgeDays=${eligibility.minMembershipAgeDays}, currentAgeDays=${membershipAgeDays}`,
        };
      }
    }

    // Verificar condiciones del evento según tipo
    if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
      const payload = event.payload as any;
      if (eligibility.minAmount !== null && eligibility.minAmount !== undefined) {
        if (payload.netAmount < eligibility.minAmount) {
          return {
            passed: false,
            reason: `Min amount not met: required=${eligibility.minAmount}, actual=${payload.netAmount}`,
          };
        }
      }
      if (eligibility.maxAmount !== null && eligibility.maxAmount !== undefined) {
        if (payload.netAmount > eligibility.maxAmount) {
          return {
            passed: false,
            reason: `Max amount exceeded: max=${eligibility.maxAmount}, actual=${payload.netAmount}`,
          };
        }
      }
      if (eligibility.minItems !== null && eligibility.minItems !== undefined) {
        if (!payload.items || payload.items.length < eligibility.minItems) {
          return {
            passed: false,
            reason: `Min items not met: required=${eligibility.minItems}, actual=${payload.items?.length || 0}`,
          };
        }
      }
      if (eligibility.categoryIds && eligibility.categoryIds.length > 0) {
        const eventCategoryIds =
          payload.items
            ?.map((item: any) => item.categoryId)
            .filter((id: any) => id !== null && id !== undefined) || [];
        const hasMatchingCategory = eligibility.categoryIds.some((catId) =>
          eventCategoryIds.includes(catId),
        );
        if (!hasMatchingCategory) {
          return {
            passed: false,
            reason: `Category mismatch: required=${eligibility.categoryIds.join(', ')}, event has=${eventCategoryIds.join(', ') || 'none'}`,
          };
        }
      }
    }

    // Verificar scope para eventos VISIT
    if (event.eventType === 'VISIT') {
      const payload = event.payload as any;
      const scope = rule.scope;

      console.log(`[RULE_EVAL] Checking VISIT scope for rule ${rule.id}:`, {
        ruleScope: scope,
        eventPayload: payload,
      });

      // Validar storeId
      if (scope.storeId !== null && scope.storeId !== undefined) {
        if (payload.storeId !== scope.storeId) {
          return {
            passed: false,
            reason: `StoreId mismatch: rule requires ${scope.storeId}, event has ${payload.storeId}`,
          };
        }
      }

      // Validar branchId
      if (scope.branchId !== null && scope.branchId !== undefined) {
        if (payload.branchId !== scope.branchId) {
          return {
            passed: false,
            reason: `BranchId mismatch: rule requires ${scope.branchId}, event has ${payload.branchId}`,
          };
        }
      }

      // Validar channel
      if (scope.channel !== null && scope.channel !== undefined && scope.channel.trim() !== '') {
        if (payload.channel !== scope.channel) {
          return {
            passed: false,
            reason: `Channel mismatch: rule requires '${scope.channel}', event has '${payload.channel}'`,
          };
        }
      }
    }

    // Verificar scope para eventos PURCHASE
    if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
      const payload = event.payload as any;
      const scope = rule.scope;

      // Validar storeId
      if (scope.storeId !== null && scope.storeId !== undefined) {
        if (payload.storeId !== scope.storeId) {
          return {
            passed: false,
            reason: `StoreId mismatch: rule requires ${scope.storeId}, event has ${payload.storeId}`,
          };
        }
      }

      // Validar branchId
      if (scope.branchId !== null && scope.branchId !== undefined) {
        if (payload.branchId !== scope.branchId) {
          return {
            passed: false,
            reason: `BranchId mismatch: rule requires ${scope.branchId}, event has ${payload.branchId}`,
          };
        }
      }

      // Validar channel
      if (scope.channel !== null && scope.channel !== undefined && scope.channel.trim() !== '') {
        if (payload.channel !== scope.channel) {
          return {
            passed: false,
            reason: `Channel mismatch: rule requires '${scope.channel}', event has '${payload.channel}'`,
          };
        }
      }
    }

    // Verificar condiciones para eventos SUBSCRIPTION
    if (event.eventType === 'SUBSCRIPTION' && 'subscriptionId' in event.payload) {
      const payload = event.payload as any;

      // Validar subscriptionType si está en eligibility
      // Nota: Por ahora no hay campo específico en eligibility para subscriptionType,
      // pero se puede agregar en el futuro. Por ahora validamos que el evento tenga subscriptionType válido
      if (!payload.subscriptionType) {
        return {
          passed: false,
          reason: `SubscriptionType missing in event payload`,
        };
      }

      // Validar que subscription status sea ACTIVE (si está en metadata)
      // Esto se puede validar desde el sistema de suscripciones antes de crear el evento
      // Por ahora asumimos que si el evento existe, la suscripción está activa
    }

    // Verificar condiciones para eventos RETENTION
    if (event.eventType === 'RETENTION' && 'streakType' in event.payload) {
      const payload = event.payload as any;

      // Validar que tenga streakCount válido
      if (!payload.streakCount || payload.streakCount <= 0) {
        return {
          passed: false,
          reason: `Invalid streakCount: ${payload.streakCount || 'missing'}`,
        };
      }

      // Validar que tenga streakType válido
      const validStreakTypes = ['VISIT', 'PURCHASE', 'MIXED'];
      if (!payload.streakType || !validStreakTypes.includes(payload.streakType)) {
        return {
          passed: false,
          reason: `Invalid streakType: ${payload.streakType || 'missing'}, valid types: ${validStreakTypes.join(', ')}`,
        };
      }

      // Validar periodo si está en eligibility (opcional, por ahora no hay validación específica)
    }

    // Verificar condiciones para eventos CUSTOM
    if (event.eventType === 'CUSTOM' && 'customType' in event.payload) {
      const payload = event.payload as any;

      // Validar que tenga customType
      if (!payload.customType || typeof payload.customType !== 'string') {
        return {
          passed: false,
          reason: `CustomType missing or invalid: ${payload.customType || 'missing'}`,
        };
      }

      // Validar flags/tags si están en eligibility
      if (eligibility.flags && eligibility.flags.length > 0) {
        // Buscar flags en el payload o metadata del evento
        const eventFlags = payload.flags || event.metadata?.flags || [];
        if (!Array.isArray(eventFlags)) {
          return {
            passed: false,
            reason: `Event flags is not an array: ${typeof eventFlags}`,
          };
        }

        // Verificar que al menos uno de los flags requeridos esté presente
        const hasRequiredFlag = eligibility.flags.some((flag) => eventFlags.includes(flag));
        if (!hasRequiredFlag) {
          return {
            passed: false,
            reason: `Required flags not found: required=${eligibility.flags.join(', ')}, event has=${eventFlags.join(', ') || 'none'}`,
          };
        }
      }

      // Validar metadata personalizada si está en eligibility
      if (eligibility.metadata) {
        for (const [key, expectedValue] of Object.entries(eligibility.metadata)) {
          const actualValue = payload[key] || event.metadata?.[key];
          if (actualValue !== expectedValue) {
            return {
              passed: false,
              reason: `Metadata mismatch for key '${key}': expected=${expectedValue}, actual=${actualValue}`,
            };
          }
        }
      }
    }

    // Verificar día de la semana
    if (eligibility.dayOfWeek && eligibility.dayOfWeek.length > 0) {
      const eventDayOfWeek = event.occurredAt.getDay();
      if (!eligibility.dayOfWeek.includes(eventDayOfWeek)) {
        return {
          passed: false,
          reason: `Day of week not allowed: event day=${eventDayOfWeek}, allowed days=${eligibility.dayOfWeek.join(', ')}`,
        };
      }
    }

    // Verificar rango de horas
    if (eligibility.timeRange) {
      const eventHour = event.occurredAt.getHours();
      const eventMinute = event.occurredAt.getMinutes();
      const eventTime = eventHour * 60 + eventMinute;

      const [startHour, startMinute] = eligibility.timeRange.start.split(':').map(Number);
      const [endHour, endMinute] = eligibility.timeRange.end.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      if (eventTime < startTime || eventTime > endTime) {
        return {
          passed: false,
          reason: `Time range not allowed: event time=${eventTime}, allowed range=${startTime}-${endTime}`,
        };
      }
    }

    return { passed: true };
  }

  /**
   * Calcula puntos según la fórmula de la regla
   */
  private calculatePoints(
    rule: RewardRule,
    event: LoyaltyEvent,
    tier: CustomerTier | null,
  ): number {
    let basePoints = 0;

    // Calcular puntos base según fórmula
    switch (rule.pointsFormula.type) {
      case 'fixed':
        basePoints = rule.pointsFormula.points;
        break;

      case 'rate':
        if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
          const payload = event.payload as any;

          // Si es BONUS_CATEGORY o BONUS_SKU, calcular por items específicos
          if (rule.earningDomain === 'BONUS_CATEGORY' || rule.earningDomain === 'BONUS_SKU') {
            basePoints = this.calculatePointsByCategoryOrSku(rule, payload);
          } else {
            // Cálculo normal por monto total
            const amount =
              rule.pointsFormula.amountField === 'netAmount'
                ? payload.netAmount
                : payload.grossAmount;
            const rawPoints = amount * rule.pointsFormula.rate;

            // Aplicar redondeo
            switch (rule.pointsFormula.roundingPolicy) {
              case 'floor':
                basePoints = Math.floor(rawPoints);
                break;
              case 'ceil':
                basePoints = Math.ceil(rawPoints);
                break;
              case 'nearest':
                basePoints = Math.round(rawPoints);
                break;
            }

            // Aplicar min/max
            if (
              rule.pointsFormula.minPoints !== null &&
              rule.pointsFormula.minPoints !== undefined
            ) {
              basePoints = Math.max(basePoints, rule.pointsFormula.minPoints);
            }
            if (
              rule.pointsFormula.maxPoints !== null &&
              rule.pointsFormula.maxPoints !== undefined
            ) {
              basePoints = Math.min(basePoints, rule.pointsFormula.maxPoints);
            }
          }
        }
        break;

      case 'table':
        if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
          const payload = event.payload as any;
          const amount =
            rule.pointsFormula.amountField === 'netAmount'
              ? payload.netAmount
              : payload.grossAmount;

          // Buscar en la tabla
          for (const row of rule.pointsFormula.table) {
            if (amount >= row.min && (row.max === null || amount <= row.max)) {
              basePoints = row.points;
              break;
            }
          }
        }
        break;

      case 'hybrid':
        // Calcular base
        if (rule.pointsFormula.base.type === 'fixed') {
          basePoints = rule.pointsFormula.base.points;
        } else if (rule.pointsFormula.base.type === 'rate') {
          // Similar a rate pero sin min/max aquí
          if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
            const payload = event.payload as any;
            const amount =
              rule.pointsFormula.base.amountField === 'netAmount'
                ? payload.netAmount
                : payload.grossAmount;
            basePoints = Math.round(amount * rule.pointsFormula.base.rate);
          }
        }

        // Aplicar bonos si aplican
        for (const bonus of rule.pointsFormula.bonuses) {
          // Por simplicidad, asumimos que el bonus aplica si la condición básica se cumple
          // En producción, esto debería evaluar la condición completa
          if (bonus.bonus.type === 'fixed') {
            basePoints += bonus.bonus.points;
          } else if (bonus.bonus.type === 'rate') {
            if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
              const payload = event.payload as any;
              const amount =
                bonus.bonus.amountField === 'netAmount' ? payload.netAmount : payload.grossAmount;
              basePoints += Math.round(amount * bonus.bonus.rate);
            }
          }
        }
        break;
    }

    // Para eventos SUBSCRIPTION, aplicar multiplicador por antigüedad si está configurado
    if (event.eventType === 'SUBSCRIPTION' && 'subscriptionId' in event.payload) {
      const payload = event.payload as any;
      // Si hay metadata con subscriptionAgeMonths, aplicar multiplicador
      if (event.metadata?.subscriptionAgeMonths) {
        const ageMonths = event.metadata.subscriptionAgeMonths;
        // Multiplicador por antigüedad: +0.1 por cada mes (ej: 12 meses = 1.2x, 24 meses = 1.4x)
        // Esto se puede configurar en la regla en el futuro, por ahora usamos fórmula fija
        const ageMultiplier = 1 + ageMonths * 0.1;
        basePoints = Math.round(basePoints * ageMultiplier);
      }
    }

    // Para eventos RETENTION, calcular bonus por streak
    if (event.eventType === 'RETENTION' && 'streakType' in event.payload) {
      const payload = event.payload as any;
      const streakCount = payload.streakCount || 0;

      // Si la fórmula es 'fixed', usar puntos base multiplicados por streak count
      if (rule.pointsFormula.type === 'fixed') {
        // Bonus por streak: puntos base * streak count
        basePoints = rule.pointsFormula.points * streakCount;
      } else if (rule.pointsFormula.type === 'rate') {
        // Si es rate, usar streak count como "monto" (ej: 10 puntos por día de streak)
        const rawPoints = streakCount * rule.pointsFormula.rate;
        basePoints = Math.round(rawPoints);

        // Aplicar min/max
        if (rule.pointsFormula.minPoints !== null && rule.pointsFormula.minPoints !== undefined) {
          basePoints = Math.max(basePoints, rule.pointsFormula.minPoints);
        }
        if (rule.pointsFormula.maxPoints !== null && rule.pointsFormula.maxPoints !== undefined) {
          basePoints = Math.min(basePoints, rule.pointsFormula.maxPoints);
        }
      } else if (rule.pointsFormula.type === 'table') {
        // Buscar en la tabla según streak count
        for (const row of rule.pointsFormula.table) {
          if (streakCount >= row.min && (row.max === null || streakCount <= row.max)) {
            basePoints = row.points;
            break;
          }
        }
      }
    }

    // Para eventos CUSTOM, calcular puntos según fórmula personalizada
    if (event.eventType === 'CUSTOM' && 'customType' in event.payload) {
      const payload = event.payload as any;

      // Calcular puntos según fórmula
      if (rule.pointsFormula.type === 'fixed') {
        basePoints = rule.pointsFormula.points;
      } else if (rule.pointsFormula.type === 'rate') {
        // Para CUSTOM, buscar un campo numérico en el payload (ej: amount, value, quantity)
        const amount = payload.amount || payload.value || payload.quantity || 0;
        const rawPoints = amount * rule.pointsFormula.rate;

        // Aplicar redondeo
        switch (rule.pointsFormula.roundingPolicy) {
          case 'floor':
            basePoints = Math.floor(rawPoints);
            break;
          case 'ceil':
            basePoints = Math.ceil(rawPoints);
            break;
          case 'nearest':
            basePoints = Math.round(rawPoints);
            break;
        }

        // Aplicar min/max
        if (rule.pointsFormula.minPoints !== null && rule.pointsFormula.minPoints !== undefined) {
          basePoints = Math.max(basePoints, rule.pointsFormula.minPoints);
        }
        if (rule.pointsFormula.maxPoints !== null && rule.pointsFormula.maxPoints !== undefined) {
          basePoints = Math.min(basePoints, rule.pointsFormula.maxPoints);
        }
      } else if (rule.pointsFormula.type === 'table') {
        // Buscar en la tabla según un valor del payload
        const value = payload.amount || payload.value || payload.quantity || 0;
        for (const row of rule.pointsFormula.table) {
          if (value >= row.min && (row.max === null || value <= row.max)) {
            basePoints = row.points;
            break;
          }
        }
      } else if (rule.pointsFormula.type === 'hybrid') {
        // Calcular base
        if (rule.pointsFormula.base.type === 'fixed') {
          basePoints = rule.pointsFormula.base.points;
        } else if (rule.pointsFormula.base.type === 'rate') {
          const amount = payload.amount || payload.value || payload.quantity || 0;
          basePoints = Math.round(amount * rule.pointsFormula.base.rate);
        }

        // Aplicar bonos si aplican
        for (const bonus of rule.pointsFormula.bonuses) {
          // Evaluar condición del bonus (simplificado)
          if (bonus.bonus.type === 'fixed') {
            basePoints += bonus.bonus.points;
          } else if (bonus.bonus.type === 'rate') {
            const amount = payload.amount || payload.value || payload.quantity || 0;
            basePoints += Math.round(amount * bonus.bonus.rate);
          }
        }
      }
    }

    // Aplicar multiplicador de tier si existe
    if (tier && tier.multiplier) {
      basePoints = Math.round(basePoints * tier.multiplier);
    }

    return Math.max(0, basePoints); // Asegurar que no sea negativo
  }

  /**
   * Verifica si una regla pasa los límites de frecuencia y cooldown
   * Consulta transacciones previas desde el ledger para validar límites
   */
  private async checkFrequencyLimits(
    rule: RewardRule,
    event: LoyaltyEvent,
    membershipId: number,
  ): Promise<{ passed: boolean; reason?: string }> {
    const limits = rule.limits;

    // Si no hay límites definidos, pasar
    if (!limits || (!limits.frequency && !limits.cooldownHours && !limits.perPeriodCap)) {
      return { passed: true };
    }

    const now = event.occurredAt;
    let startDate: Date;
    const endDate: Date = now;

    // Determinar periodo según frequency
    if (limits.frequency === 'daily') {
      // Últimas 24 horas
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (limits.frequency === 'weekly') {
      // Últimos 7 días
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (limits.frequency === 'monthly') {
      // Últimos 30 días
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (limits.frequency === 'per-period' && limits.periodDays) {
      // Periodo personalizado
      startDate = new Date(now.getTime() - limits.periodDays * 24 * 60 * 60 * 1000);
    } else if (event.eventType === 'SUBSCRIPTION' && 'subscriptionId' in event.payload) {
      // Para suscripciones, si no hay frequency definido, usar "1 por ciclo" (año calendario)
      // Esto es un comportamiento por defecto para suscripciones
      const payload = event.payload as any;
      if (payload.subscriptionType === 'RENEWED') {
        // Para renovaciones, verificar último año calendario
        const currentYear = now.getFullYear();
        startDate = new Date(currentYear, 0, 1); // Inicio del año actual
      } else if (payload.subscriptionType === 'STARTED') {
        // Para inicio, verificar si ya hubo un STARTED en el último año
        const currentYear = now.getFullYear();
        startDate = new Date(currentYear, 0, 1);
      } else {
        // Otros tipos, usar per-event
        startDate = new Date(0);
      }
    } else {
      // per-event o sin frequency definido
      startDate = new Date(0); // Desde el inicio de los tiempos (solo para cooldown)
    }

    // Consultar transacciones previas
    const previousTransactions =
      await this.pointsTransactionRepository.findEarningsByMembershipAndPeriod(
        membershipId,
        rule.programId,
        rule.id,
        startDate,
        endDate,
      );

    // Validar cooldown
    if (limits.cooldownHours) {
      const cooldownMs = limits.cooldownHours * 60 * 60 * 1000;
      const cooldownStart = new Date(now.getTime() - cooldownMs);

      const hasRecentTransaction = previousTransactions.some((tx) => tx.createdAt >= cooldownStart);

      if (hasRecentTransaction) {
        return {
          passed: false,
          reason: `Cooldown not expired: cooldownHours=${limits.cooldownHours}, found ${previousTransactions.length} recent transactions`,
        };
      }
    }

    // Validar frequency (máximo 1 por periodo)
    if (limits.frequency && limits.frequency !== 'per-event') {
      // Si hay transacciones en el periodo, rechazar
      if (previousTransactions.length > 0) {
        return {
          passed: false,
          reason: `Frequency limit exceeded: frequency=${limits.frequency}, found ${previousTransactions.length} transactions in period`,
        };
      }
    }

    // Para eventos SUBSCRIPTION, validar límites específicos
    if (event.eventType === 'SUBSCRIPTION' && 'subscriptionId' in event.payload) {
      const payload = event.payload as any;

      // Validar "1 por ciclo" para renovaciones
      if (payload.subscriptionType === 'RENEWED') {
        // Buscar renovaciones previas en el último año calendario
        const currentYear = now.getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        const renewalsThisYear =
          await this.pointsTransactionRepository.findEarningsByMembershipAndPeriod(
            membershipId,
            rule.programId,
            rule.id,
            yearStart,
            yearEnd,
          );

        // Filtrar solo renovaciones (verificar metadata o reasonCode)
        const renewalTransactions = renewalsThisYear.filter(
          (tx) =>
            tx.reasonCode === 'BASE_SUBSCRIPTION' || tx.metadata?.subscriptionType === 'RENEWED',
        );

        if (renewalTransactions.length > 0) {
          return {
            passed: false,
            reason: `Subscription renewal already exists this year: found ${renewalTransactions.length} renewals`,
          };
        }
      }

      // Validar "1 por ciclo" para inicio (solo una vez por suscripción)
      if (payload.subscriptionType === 'STARTED') {
        // Buscar si ya hubo un STARTED para esta suscripción
        const allSubscriptions =
          await this.pointsTransactionRepository.findEarningsByMembershipAndPeriod(
            membershipId,
            rule.programId,
            rule.id,
            new Date(0), // Desde siempre
            now,
          );

        const startedTransactions = allSubscriptions.filter(
          (tx) =>
            tx.metadata?.subscriptionId === payload.subscriptionId &&
            (tx.metadata?.subscriptionType === 'STARTED' || tx.reasonCode === 'BASE_SUBSCRIPTION'),
        );

        if (startedTransactions.length > 0) {
          return {
            passed: false,
            reason: `Subscription start already exists: found ${startedTransactions.length} starts for subscriptionId=${payload.subscriptionId}`,
          };
        }
      }

      // Validar cap anual si está definido
      if (limits.perPeriodCap && limits.periodType === 'calendar' && limits.periodDays === 365) {
        const currentYear = now.getFullYear();
        const yearStart = new Date(currentYear, 0, 1);
        const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

        const transactionsThisYear =
          await this.pointsTransactionRepository.findEarningsByMembershipAndPeriod(
            membershipId,
            rule.programId,
            rule.id,
            yearStart,
            yearEnd,
          );

        const totalPointsThisYear = transactionsThisYear.reduce(
          (sum, tx) => sum + tx.pointsDelta,
          0,
        );
        if (totalPointsThisYear >= limits.perPeriodCap) {
          return {
            passed: false,
            reason: `Period cap exceeded: cap=${limits.perPeriodCap}, current=${totalPointsThisYear}`,
          };
        }
      }
    }

    // Para eventos RETENTION, validar límite "1 por ventana"
    if (event.eventType === 'RETENTION' && 'streakType' in event.payload) {
      const payload = event.payload as any;

      // Validar que no haya otro evento RETENTION en la misma ventana
      // La ventana viene en el payload (periodStart, periodEnd)
      if (payload.periodStart && payload.periodEnd) {
        const periodStart = new Date(payload.periodStart);
        const periodEnd = new Date(payload.periodEnd);

        const retentionTransactions =
          await this.pointsTransactionRepository.findEarningsByMembershipAndPeriod(
            membershipId,
            rule.programId,
            rule.id,
            periodStart,
            periodEnd,
          );

        // Filtrar solo transacciones de RETENTION
        const retentionTx = retentionTransactions.filter(
          (tx) => tx.metadata?.eventType === 'RETENTION' || tx.reasonCode === 'BASE_RETENTION',
        );

        if (retentionTx.length > 0) {
          return {
            passed: false,
            reason: `Retention event already exists in period: found ${retentionTx.length} transactions`,
          };
        }
      }
    }

    // Validar perPeriodCap (se aplicará después en ConflictResolver, pero podemos pre-validar aquí)
    // Nota: perPeriodCap se aplica después de calcular puntos, así que aquí solo validamos frecuencia y cooldown

    return { passed: true };
  }

  /**
   * Calcula puntos por categoría o SKU específico
   * Solo aplica a reglas con earningDomain BONUS_CATEGORY o BONUS_SKU
   */
  private calculatePointsByCategoryOrSku(rule: RewardRule, payload: any): number {
    if (!payload.items || !Array.isArray(payload.items)) {
      return 0;
    }

    let totalPoints = 0;
    const scope = rule.scope;

    for (const item of payload.items) {
      let itemMatches = false;

      // Verificar si el item coincide con el scope de la regla
      if (rule.earningDomain === 'BONUS_CATEGORY') {
        // Verificar categoría
        if (scope.categoryId !== null && scope.categoryId !== undefined) {
          if (item.categoryId === scope.categoryId) {
            itemMatches = true;
          }
        } else if (rule.eligibility.categoryIds && rule.eligibility.categoryIds.length > 0) {
          // Usar categoryIds de eligibility si no hay en scope
          if (rule.eligibility.categoryIds.includes(item.categoryId)) {
            itemMatches = true;
          }
        }
      } else if (rule.earningDomain === 'BONUS_SKU') {
        // Verificar SKU
        if (scope.sku !== null && scope.sku !== undefined && scope.sku.trim() !== '') {
          if (item.sku === scope.sku) {
            itemMatches = true;
          }
        } else if (rule.eligibility.skus && rule.eligibility.skus.length > 0) {
          // Usar skus de eligibility si no hay en scope
          if (rule.eligibility.skus.includes(item.sku)) {
            itemMatches = true;
          }
        }
      }

      if (itemMatches && rule.pointsFormula.type === 'rate') {
        // Calcular puntos para este item
        const itemAmount = item.unitPrice * item.qty;
        const rawPoints = itemAmount * rule.pointsFormula.rate;

        // Aplicar redondeo
        let itemPoints = 0;
        switch (rule.pointsFormula.roundingPolicy) {
          case 'floor':
            itemPoints = Math.floor(rawPoints);
            break;
          case 'ceil':
            itemPoints = Math.ceil(rawPoints);
            break;
          case 'nearest':
            itemPoints = Math.round(rawPoints);
            break;
        }

        // Aplicar min/max por item (si está definido)
        if (rule.pointsFormula.minPoints !== null && rule.pointsFormula.minPoints !== undefined) {
          itemPoints = Math.max(itemPoints, rule.pointsFormula.minPoints);
        }
        if (rule.pointsFormula.maxPoints !== null && rule.pointsFormula.maxPoints !== undefined) {
          itemPoints = Math.min(itemPoints, rule.pointsFormula.maxPoints);
        }

        totalPoints += itemPoints;
      } else if (itemMatches && rule.pointsFormula.type === 'fixed') {
        // Puntos fijos por item que coincida
        totalPoints += rule.pointsFormula.points * item.qty;
      }
    }

    return totalPoints;
  }
}
