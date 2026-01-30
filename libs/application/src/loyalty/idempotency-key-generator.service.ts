import { Injectable } from '@nestjs/common';
import { RewardRule, LoyaltyEvent, IdempotencyScopeStrategy } from '@libs/domain';

/**
 * Servicio para generar keys de idempotencia según la estrategia de la regla
 * Implementa la lógica descrita en PLAN-TIPOS-RECOMPENSA.md
 */
@Injectable()
export class IdempotencyKeyGenerator {
  /**
   * Genera una key de idempotencia para una regla y evento dados
   */
  generateKey(rule: RewardRule, event: LoyaltyEvent, membershipId: number): string {
    const strategy = rule.idempotencyScope.strategy;
    const baseKey = this.generateBaseKey(event, membershipId, rule);

    switch (strategy) {
      case 'default':
        // (tenant, membership, program, rule, sourceEventId)
        return `${baseKey}:${event.sourceEventId}`;

      case 'per-day':
        // + bucketKey=YYYY-MM-DD
        const bucketKey = this.getBucketKey(event.occurredAt, rule.idempotencyScope.bucketTimezone);
        return `${baseKey}:${bucketKey}`;

      case 'per-period':
        // + bucketKey según periodo
        const periodBucketKey = this.getPeriodBucketKey(
          event.occurredAt,
          rule.idempotencyScope.periodDays || 30,
          rule.idempotencyScope.bucketTimezone,
        );
        return `${baseKey}:${periodBucketKey}`;

      case 'per-event':
        // Solo sourceEventId
        return `${baseKey}:${event.sourceEventId}`;

      default:
        // Por defecto, usar default strategy
        return `${baseKey}:${event.sourceEventId}`;
    }
  }

  /**
   * Genera la parte base de la key
   */
  private generateBaseKey(event: LoyaltyEvent, membershipId: number, rule: RewardRule): string {
    return `loyalty:${event.tenantId}:${membershipId}:${rule.programId}:${rule.id}`;
  }

  /**
   * Obtiene bucket key para per-day strategy
   */
  private getBucketKey(occurredAt: Date, timezone?: string | null): string {
    // Por simplicidad, usar UTC. En producción, usar timezone si está disponible
    const date = new Date(occurredAt);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtiene bucket key para per-period strategy
   */
  private getPeriodBucketKey(
    occurredAt: Date,
    periodDays: number,
    timezone?: string | null,
  ): string {
    // Calcular el inicio del periodo
    const date = new Date(occurredAt);
    const periodStart = new Date(date);
    periodStart.setUTCDate(periodStart.getUTCDate() - (periodStart.getUTCDate() % periodDays));

    const year = periodStart.getUTCFullYear();
    const month = String(periodStart.getUTCMonth() + 1).padStart(2, '0');
    const day = String(periodStart.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}:${periodDays}d`;
  }
}
