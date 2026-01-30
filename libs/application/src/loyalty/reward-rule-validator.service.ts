import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IRewardRuleRepository,
  RewardRule,
  isValidEarningDomain,
  isValidConflictGroup,
  isValidStackPolicy,
} from '@libs/domain';

/**
 * Servicio de validación para reglas de recompensa
 * Implementa las reglas anti-caos descritas en PLAN-TIPOS-RECOMPENSA.md
 */
@Injectable()
export class RewardRuleValidator {
  constructor(
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
  ) {}

  /**
   * Valida que una regla pueda ser creada/actualizada según reglas anti-caos
   */
  async validateRule(rule: RewardRule): Promise<void> {
    // Validación 1: conflictGroup requerido y válido
    if (!rule.conflict.conflictGroup) {
      throw new BadRequestException('conflictGroup is required (HARD RULE)');
    }
    if (!isValidConflictGroup(rule.conflict.conflictGroup)) {
      throw new BadRequestException(
        `Invalid conflictGroup: ${rule.conflict.conflictGroup}. Must be from catalog.`,
      );
    }

    // Validación 2: stackPolicy requerido y válido
    if (!rule.conflict.stackPolicy) {
      throw new BadRequestException('stackPolicy is required (HARD RULE)');
    }
    if (!isValidStackPolicy(rule.conflict.stackPolicy)) {
      throw new BadRequestException(
        `Invalid stackPolicy: ${rule.conflict.stackPolicy}. Must be from catalog.`,
      );
    }

    // Validación 3: idempotencyScope requerido
    if (!rule.idempotencyScope || !rule.idempotencyScope.strategy) {
      throw new BadRequestException('idempotencyScope.strategy is required (HARD RULE)');
    }

    // Validación 4: earningDomain requerido y válido
    if (!rule.earningDomain) {
      throw new BadRequestException('earningDomain is required (HARD RULE)');
    }
    if (!isValidEarningDomain(rule.earningDomain)) {
      throw new BadRequestException(
        `Invalid earningDomain: ${rule.earningDomain}. Must be from catalog.`,
      );
    }

    // Validación 5: trigger PURCHASE requiere amountField en pointsFormula
    if (rule.trigger === 'PURCHASE') {
      if (rule.pointsFormula.type === 'rate' || rule.pointsFormula.type === 'table') {
        if (!('amountField' in rule.pointsFormula)) {
          throw new BadRequestException(
            'PURCHASE trigger requires amountField in pointsFormula (HARD RULE)',
          );
        }
      }
    }

    // Validación 6: cooldown/per-day requiere bucketTimezone
    if (
      (rule.limits.frequency === 'daily' || rule.limits.cooldownHours) &&
      rule.idempotencyScope.strategy === 'per-day' &&
      !rule.idempotencyScope.bucketTimezone
    ) {
      throw new BadRequestException(
        'per-day idempotencyScope requires bucketTimezone when using daily frequency or cooldown (HARD RULE)',
      );
    }

    // Validación 7: priorityRank debe ser no negativo
    if (rule.conflict.priorityRank < 0) {
      throw new BadRequestException('priorityRank must be non-negative');
    }

    // Validación 8: activeFrom debe ser anterior a activeTo si ambos están definidos
    if (rule.activeFrom && rule.activeTo && rule.activeFrom >= rule.activeTo) {
      throw new BadRequestException('activeFrom must be before activeTo');
    }

    // Validación 9: Verificar que no haya reglas duplicadas con mismo trigger y conflictGroup activas
    if (rule.isActive()) {
      const existingRules = await this.ruleRepository.findActiveByProgramIdAndConflictGroup(
        rule.programId,
        rule.conflict.conflictGroup,
      );

      // Filtrar la regla actual si es una actualización
      const conflictingRules = existingRules.filter(
        (r) => r.id !== rule.id && r.trigger === rule.trigger,
      );

      // Si hay conflictos y stackPolicy es EXCLUSIVE, solo puede haber una activa
      if (
        conflictingRules.length > 0 &&
        rule.conflict.stackPolicy === 'EXCLUSIVE' &&
        conflictingRules.some((r) => r.conflict.stackPolicy === 'EXCLUSIVE')
      ) {
        throw new BadRequestException(
          `Cannot have multiple EXCLUSIVE rules with same trigger and conflictGroup. ` +
            `Conflicting rules: ${conflictingRules.map((r) => r.id).join(', ')}`,
        );
      }
    }

    // Validación 10: Reglas CUSTOM requieren configuración explícita de conflictGroup, stackPolicy e idempotencyScope
    if (rule.trigger === 'CUSTOM') {
      // Validar que conflictGroup no sea un valor genérico o por defecto
      const conflictGroupStr = String(rule.conflict.conflictGroup || '');
      if (
        !rule.conflict.conflictGroup ||
        conflictGroupStr.trim() === '' ||
        conflictGroupStr === 'DEFAULT' ||
        conflictGroupStr === 'CUSTOM'
      ) {
        throw new BadRequestException(
          'CUSTOM rules must declare an explicit conflictGroup (cannot be empty, DEFAULT, or CUSTOM)',
        );
      }

      // Validar que stackPolicy esté explícitamente declarado
      if (
        !rule.conflict.stackPolicy ||
        !['STACK', 'EXCLUSIVE', 'BEST_OF', 'PRIORITY'].includes(rule.conflict.stackPolicy)
      ) {
        throw new BadRequestException(
          'CUSTOM rules must explicitly declare stackPolicy (STACK, EXCLUSIVE, BEST_OF, or PRIORITY)',
        );
      }

      // Validar que idempotencyScope.strategy esté explícitamente declarado
      if (
        !rule.idempotencyScope.strategy ||
        !['default', 'per-day', 'per-period', 'per-event'].includes(rule.idempotencyScope.strategy)
      ) {
        throw new BadRequestException(
          'CUSTOM rules must explicitly declare idempotencyScope.strategy (default, per-day, per-period, or per-event)',
        );
      }

      // Validar que per-period requiera periodDays
      if (rule.idempotencyScope.strategy === 'per-period' && !rule.idempotencyScope.periodDays) {
        throw new BadRequestException(
          'CUSTOM rules with per-period idempotencyScope must declare periodDays',
        );
      }
    }
  }

  /**
   * Valida que una regla pueda ser eliminada
   * No se puede eliminar una regla si está activa y tiene transacciones asociadas
   * (Esta validación se puede extender en el futuro para verificar transacciones)
   */
  async validateRuleDeletion(ruleId: number): Promise<void> {
    const rule = await this.ruleRepository.findById(ruleId);

    if (!rule) {
      throw new BadRequestException(`Rule with ID ${ruleId} not found`);
    }

    // Por ahora solo validamos que no esté activa
    // En el futuro se puede agregar validación de transacciones asociadas
    if (rule.isActive()) {
      throw new BadRequestException(
        `Cannot delete active rule ${ruleId}. Please deactivate it first.`,
      );
    }
  }
}
