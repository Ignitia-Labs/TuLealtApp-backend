import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ICustomerMembershipRepository,
  IRewardRuleRepository,
  ILoyaltyProgramRepository,
  RewardRule,
  LoyaltyEvent,
} from '@libs/domain';
import { RetentionCalculator, StreakResult } from './retention-calculator.service';
import { ProcessLoyaltyEventHandler } from './process-loyalty-event/process-loyalty-event.handler';

/**
 * Servicio para evaluar retención periódicamente y otorgar recompensas por streaks
 * Se ejecuta como cron job o puede ser llamado manualmente
 */
@Injectable()
export class RetentionEvaluationService {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    private readonly retentionCalculator: RetentionCalculator,
    private readonly processLoyaltyEventHandler: ProcessLoyaltyEventHandler,
  ) {}

  /**
   * Cron job que se ejecuta diariamente a las 3:00 AM para evaluar streaks
   * Evalúa retención para todos los memberships activos
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async evaluateRetentionDaily(): Promise<void> {
    console.log('[RetentionEvaluationService] Iniciando evaluación diaria de retención...');

    try {
      // Obtener todos los tenants (necesitamos iterar por tenant para obtener memberships)
      // Por ahora, evaluamos para un tenant específico o todos
      // En producción, esto debería iterar por todos los tenants activos

      // Por simplicidad, evaluamos retención para memberships activos
      // En un sistema completo, esto debería obtener memberships por tenant
      await this.evaluateRetentionForAllMemberships('rolling', 30);

      console.log('[RetentionEvaluationService] Evaluación diaria de retención completada');
    } catch (error) {
      console.error('[RetentionEvaluationService] Error en evaluación diaria de retención:', error);
    }
  }

  /**
   * Evalúa retención para todos los memberships activos de un tenant
   * @param tenantId ID del tenant (opcional, si no se proporciona evalúa para todos)
   * @param windowType Tipo de ventana ('monthly' o 'rolling')
   * @param windowDays Días de la ventana (solo para rolling)
   */
  async evaluateRetentionForTenant(
    tenantId: number,
    windowType: 'monthly' | 'rolling' = 'rolling',
    windowDays: number = 30,
  ): Promise<void> {
    // Obtener todos los memberships activos del tenant
    const memberships = await this.membershipRepository.findByTenantId(tenantId);
    const activeMemberships = memberships.filter((m) => m.status === 'active');

    await this.evaluateRetentionForMemberships(
      activeMemberships.map((m) => m.id),
      windowType,
      windowDays,
    );
  }

  /**
   * Evalúa retención para múltiples memberships
   * @param membershipIds IDs de los memberships a evaluar
   * @param windowType Tipo de ventana ('monthly' o 'rolling')
   * @param windowDays Días de la ventana (solo para rolling)
   */
  async evaluateRetentionForMemberships(
    membershipIds: number[],
    windowType: 'monthly' | 'rolling' = 'rolling',
    windowDays: number = 30,
  ): Promise<void> {
    // Obtener todas las reglas de tipo RETENTION activas
    // Nota: Necesitamos obtener reglas por tenant, pero por ahora asumimos que hay reglas globales
    // En producción, esto debería filtrar por tenantId

    // Calcular streaks para cada membership
    const visitStreaks = await this.retentionCalculator.calculateStreaksForMemberships(
      membershipIds,
      'VISIT',
      windowType,
      windowDays,
    );

    const purchaseStreaks = await this.retentionCalculator.calculateStreaksForMemberships(
      membershipIds,
      'PURCHASE',
      windowType,
      windowDays,
    );

    const mixedStreaks = await this.retentionCalculator.calculateStreaksForMemberships(
      membershipIds,
      'MIXED',
      windowType,
      windowDays,
    );

    // Procesar cada streak y crear eventos RETENTION si aplica
    for (const membershipId of membershipIds) {
      try {
        const membership = await this.membershipRepository.findById(membershipId);
        if (!membership) {
          continue;
        }

        // Obtener reglas de retención para el tenant
        const retentionRules = await this.getRetentionRulesForTenant(membership.tenantId);

        if (retentionRules.length === 0) {
          continue; // No hay reglas de retención configuradas
        }

        // Procesar streaks de visitas
        const visitStreak = visitStreaks.get(membershipId);
        if (visitStreak && visitStreak.streakCount > 0) {
          await this.processStreak(membershipId, membership.tenantId, visitStreak, retentionRules);
        }

        // Procesar streaks de compras
        const purchaseStreak = purchaseStreaks.get(membershipId);
        if (purchaseStreak && purchaseStreak.streakCount > 0) {
          await this.processStreak(
            membershipId,
            membership.tenantId,
            purchaseStreak,
            retentionRules,
          );
        }

        // Procesar streaks mixtos
        const mixedStreak = mixedStreaks.get(membershipId);
        if (mixedStreak && mixedStreak.streakCount > 0) {
          await this.processStreak(membershipId, membership.tenantId, mixedStreak, retentionRules);
        }
      } catch (error) {
        console.warn(`Error processing retention for membership ${membershipId}:`, error);
      }
    }
  }

  /**
   * Evalúa retención para todos los memberships activos
   * Nota: En producción, esto debería ser más eficiente usando paginación o procesamiento por lotes
   */
  private async evaluateRetentionForAllMemberships(
    windowType: 'monthly' | 'rolling' = 'rolling',
    windowDays: number = 30,
  ): Promise<void> {
    // Por ahora, este método es un placeholder
    // En producción, debería obtener todos los tenants activos y procesar por tenant
    console.warn(
      '[RetentionEvaluationService] evaluateRetentionForAllMemberships necesita implementación completa',
    );
  }

  /**
   * Procesa un streak y crea eventos RETENTION si aplica
   */
  private async processStreak(
    membershipId: number,
    tenantId: number,
    streak: StreakResult,
    rules: RewardRule[],
  ): Promise<void> {
    // Filtrar reglas que aplican para este tipo de streak
    const applicableRules = rules.filter((rule) => {
      // Verificar que la regla sea para eventos RETENTION
      if (rule.trigger !== 'RETENTION') {
        return false;
      }

      // Verificar que el streakType coincida (si está en eligibility)
      // Por ahora, asumimos que todas las reglas RETENTION aplican a cualquier streakType
      return true;
    });

    if (applicableRules.length === 0) {
      return; // No hay reglas aplicables
    }

    // Crear evento RETENTION
    const retentionEvent: Partial<LoyaltyEvent> = {
      tenantId,
      eventType: 'RETENTION',
      sourceEventId: `RETENTION-${membershipId}-${streak.streakType}-${Date.now()}`,
      occurredAt: new Date(),
      membershipRef: {
        membershipId,
      },
      payload: {
        streakType: streak.streakType,
        streakCount: streak.streakCount,
        periodStart: streak.periodStart,
        periodEnd: streak.periodEnd,
        metadata: streak.metadata,
      },
      createdBy: 'SYSTEM',
      metadata: {
        firstStreakDate: streak.firstStreakDate,
        lastStreakDate: streak.lastStreakDate,
      },
    };

    // Procesar evento de lealtad
    try {
      await this.processLoyaltyEventHandler.execute(retentionEvent);
    } catch (error) {
      console.warn(`Error processing retention event for membership ${membershipId}:`, error);
    }
  }

  /**
   * Obtiene reglas de retención para un tenant
   */
  private async getRetentionRulesForTenant(tenantId: number): Promise<RewardRule[]> {
    // Obtener programas activos del tenant
    const programs = await this.programRepository.findActiveByTenantId(tenantId);

    // Obtener reglas de retención de cada programa
    const allRules: RewardRule[] = [];
    for (const program of programs) {
      const rules = await this.ruleRepository.findActiveByProgramIdAndTrigger(
        program.id,
        'RETENTION',
      );
      allRules.push(...rules);
    }

    return allRules;
  }
}
