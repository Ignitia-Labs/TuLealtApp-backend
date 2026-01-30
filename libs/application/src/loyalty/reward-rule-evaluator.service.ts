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
    // 1. Obtener reglas activas del programa que coincidan con el trigger
    const rules = await this.ruleRepository.findActiveByProgramIdAndTrigger(
      programId,
      event.eventType,
    );

    if (rules.length === 0) {
      return [];
    }

    // 2. Filtrar reglas por eligibility
    const eligibleRules = rules.filter((rule) =>
      this.checkEligibility(rule, event, membership, tier),
    );

    if (eligibleRules.length === 0) {
      return [];
    }

    // 2.5. Filtrar reglas por límites de frecuencia y cooldown
    const rulesPassingLimits: RewardRule[] = [];
    for (const rule of eligibleRules) {
      const passesLimits = await this.checkFrequencyLimits(rule, event, membership.id);
      if (passesLimits) {
        rulesPassingLimits.push(rule);
      }
    }

    if (rulesPassingLimits.length === 0) {
      return [];
    }

    // 3. Evaluar cada regla y calcular puntos
    const results: RuleEvaluationResult[] = [];

    // 4. Obtener TierBenefits si hay tier
    let tierBenefit: TierBenefit | null = null;
    if (tier) {
      tierBenefit = await this.tierBenefitRepository.findByProgramIdAndTierId(programId, tier.id);
    }

    for (const rule of rulesPassingLimits) {
      try {
        let points = this.calculatePoints(rule, event, tier);

        // Aplicar TierBenefits si existe
        if (tierBenefit && tierBenefit.isActive()) {
          points = tierBenefit.applyMultiplier(points);
        }

        if (points > 0) {
          results.push({
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
          });
        }
      } catch (error) {
        // Log error pero continuar con otras reglas
        console.warn(`Error evaluating rule ${rule.id}:`, error);
      }
    }

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
  ): boolean {
    const eligibility = rule.eligibility;

    // Verificar condiciones de membership
    if (eligibility.membershipStatus) {
      if (!eligibility.membershipStatus.includes(membership.status)) {
        return false;
      }
    }

    // Verificar tier
    if (eligibility.minTierId !== null && eligibility.minTierId !== undefined) {
      if (!tier || tier.priority < eligibility.minTierId) {
        return false;
      }
    }
    if (eligibility.maxTierId !== null && eligibility.maxTierId !== undefined) {
      if (tier && tier.priority > eligibility.maxTierId) {
        return false;
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
        return false;
      }
    }

    // Verificar condiciones del evento según tipo
    if (event.eventType === 'PURCHASE' && 'orderId' in event.payload) {
      const payload = event.payload as any;
      if (eligibility.minAmount !== null && eligibility.minAmount !== undefined) {
        if (payload.netAmount < eligibility.minAmount) {
          return false;
        }
      }
      if (eligibility.maxAmount !== null && eligibility.maxAmount !== undefined) {
        if (payload.netAmount > eligibility.maxAmount) {
          return false;
        }
      }
      if (eligibility.minItems !== null && eligibility.minItems !== undefined) {
        if (!payload.items || payload.items.length < eligibility.minItems) {
          return false;
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
          return false;
        }
      }
    }

    // Verificar scope para eventos VISIT
    if (event.eventType === 'VISIT' && 'storeId' in event.payload) {
      const payload = event.payload as any;
      const scope = rule.scope;

      // Validar storeId
      if (scope.storeId !== null && scope.storeId !== undefined) {
        if (payload.storeId !== scope.storeId) {
          return false;
        }
      }

      // Validar branchId
      if (scope.branchId !== null && scope.branchId !== undefined) {
        if (payload.branchId !== scope.branchId) {
          return false;
        }
      }

      // Validar channel
      if (scope.channel !== null && scope.channel !== undefined && scope.channel.trim() !== '') {
        if (payload.channel !== scope.channel) {
          return false;
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
          return false;
        }
      }

      // Validar branchId
      if (scope.branchId !== null && scope.branchId !== undefined) {
        if (payload.branchId !== scope.branchId) {
          return false;
        }
      }

      // Validar channel
      if (scope.channel !== null && scope.channel !== undefined && scope.channel.trim() !== '') {
        if (payload.channel !== scope.channel) {
          return false;
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
        return false;
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
        return false;
      }

      // Validar que tenga streakType válido
      const validStreakTypes = ['VISIT', 'PURCHASE', 'MIXED'];
      if (!payload.streakType || !validStreakTypes.includes(payload.streakType)) {
        return false;
      }

      // Validar periodo si está en eligibility (opcional, por ahora no hay validación específica)
    }

    // Verificar condiciones para eventos CUSTOM
    if (event.eventType === 'CUSTOM' && 'customType' in event.payload) {
      const payload = event.payload as any;

      // Validar que tenga customType
      if (!payload.customType || typeof payload.customType !== 'string') {
        return false;
      }

      // Validar flags/tags si están en eligibility
      if (eligibility.flags && eligibility.flags.length > 0) {
        // Buscar flags en el payload o metadata del evento
        const eventFlags = payload.flags || event.metadata?.flags || [];
        if (!Array.isArray(eventFlags)) {
          return false;
        }

        // Verificar que al menos uno de los flags requeridos esté presente
        const hasRequiredFlag = eligibility.flags.some((flag) => eventFlags.includes(flag));
        if (!hasRequiredFlag) {
          return false;
        }
      }

      // Validar metadata personalizada si está en eligibility
      if (eligibility.metadata) {
        for (const [key, expectedValue] of Object.entries(eligibility.metadata)) {
          const actualValue = payload[key] || event.metadata?.[key];
          if (actualValue !== expectedValue) {
            return false;
          }
        }
      }
    }

    // Verificar día de la semana
    if (eligibility.dayOfWeek && eligibility.dayOfWeek.length > 0) {
      const eventDayOfWeek = event.occurredAt.getDay();
      if (!eligibility.dayOfWeek.includes(eventDayOfWeek)) {
        return false;
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
        return false;
      }
    }

    return true;
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
  ): Promise<boolean> {
    const limits = rule.limits;

    // Si no hay límites definidos, pasar
    if (!limits || (!limits.frequency && !limits.cooldownHours && !limits.perPeriodCap)) {
      return true;
    }

    const now = event.occurredAt;
    let startDate: Date;
    let endDate: Date = now;

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
        return false; // Está en cooldown
      }
    }

    // Validar frequency (máximo 1 por periodo)
    if (limits.frequency && limits.frequency !== 'per-event') {
      // Si hay transacciones en el periodo, rechazar
      if (previousTransactions.length > 0) {
        return false;
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
          return false; // Ya hubo una renovación este año
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
          return false; // Ya hubo un inicio para esta suscripción
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
          return false; // Ya se alcanzó el cap anual
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
          return false; // Ya hubo un evento RETENTION en esta ventana
        }
      }
    }

    // Validar perPeriodCap (se aplicará después en ConflictResolver, pero podemos pre-validar aquí)
    // Nota: perPeriodCap se aplica después de calcular puntos, así que aquí solo validamos frecuencia y cooldown

    return true;
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
