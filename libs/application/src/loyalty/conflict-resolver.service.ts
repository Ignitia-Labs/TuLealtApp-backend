import { Injectable, Inject } from '@nestjs/common';
import {
  RuleEvaluationResult,
  StackPolicy,
  IPointsTransactionRepository,
  IRewardRuleRepository,
} from '@libs/domain';

/**
 * Servicio para resolver conflictos entre reglas según conflictGroup y stackPolicy
 * Implementa la lógica descrita en PLAN-TIPOS-RECOMPENSA.md sección 6
 */
@Injectable()
export class ConflictResolver {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
  ) {}

  /**
   * Resuelve conflictos entre resultados de evaluación agrupados por conflictGroup
   * @param evaluations Lista de evaluaciones a resolver
   * @param eventDate Fecha del evento (para calcular periodos)
   * @param membershipId ID de la membership (para consultar transacciones previas)
   * @returns Lista final de evaluaciones después de resolver conflictos
   */
  async resolveConflicts(
    evaluations: RuleEvaluationResult[],
    eventDate: Date,
    membershipId: number,
  ): Promise<RuleEvaluationResult[]> {
    if (evaluations.length === 0) {
      return [];
    }

    // 1. Agrupar por conflictGroup
    const groupedByConflictGroup = this.groupByConflictGroup(evaluations);

    // 2. Resolver conflictos dentro de cada grupo
    const resolved: RuleEvaluationResult[] = [];

    for (const [conflictGroup, groupEvaluations] of Object.entries(groupedByConflictGroup)) {
      if (groupEvaluations.length === 0) {
        continue;
      }

      // Obtener stackPolicy del primer elemento (todos en el grupo deberían tener el mismo)
      const stackPolicy = groupEvaluations[0].stackPolicy as StackPolicy;

      // Aplicar resolución según stackPolicy
      const resolvedGroup = await this.resolveGroup(
        groupEvaluations,
        stackPolicy,
        eventDate,
        membershipId,
      );
      resolved.push(...resolvedGroup);
    }

    return resolved;
  }

  /**
   * Agrupa evaluaciones por conflictGroup
   */
  private groupByConflictGroup(
    evaluations: RuleEvaluationResult[],
  ): Record<string, RuleEvaluationResult[]> {
    const grouped: Record<string, RuleEvaluationResult[]> = {};

    for (const eval_ of evaluations) {
      if (!grouped[eval_.conflictGroup]) {
        grouped[eval_.conflictGroup] = [];
      }
      grouped[eval_.conflictGroup].push(eval_);
    }

    return grouped;
  }

  /**
   * Resuelve conflictos dentro de un grupo según stackPolicy
   */
  private async resolveGroup(
    evaluations: RuleEvaluationResult[],
    stackPolicy: StackPolicy,
    eventDate: Date,
    membershipId: number,
  ): Promise<RuleEvaluationResult[]> {
    switch (stackPolicy) {
      case 'STACK':
        // Aplicar todas, luego aplicar caps si es necesario
        return await this.applyCaps(evaluations, eventDate, membershipId);

      case 'EXCLUSIVE':
        // Elegir 1 por prioridad o best value
        return [this.selectBestByPriority(evaluations)];

      case 'BEST_OF':
        // Elegir la que da más puntos
        return [this.selectBestByPoints(evaluations)];

      case 'PRIORITY':
        // Elegir la mayor priorityRank
        return [this.selectBestByPriorityRank(evaluations)];

      default:
        // Por defecto, aplicar todas
        return evaluations;
    }
  }

  /**
   * Selecciona la mejor evaluación por prioridad (priorityRank)
   */
  private selectBestByPriority(evaluations: RuleEvaluationResult[]): RuleEvaluationResult {
    return evaluations.reduce((best, current) => {
      if (current.priorityRank > best.priorityRank) {
        return current;
      }
      // Si tienen el mismo priorityRank, elegir la que da más puntos
      if (current.priorityRank === best.priorityRank && current.points > best.points) {
        return current;
      }
      return best;
    });
  }

  /**
   * Selecciona la mejor evaluación por puntos
   */
  private selectBestByPoints(evaluations: RuleEvaluationResult[]): RuleEvaluationResult {
    return evaluations.reduce((best, current) => {
      return current.points > best.points ? current : best;
    });
  }

  /**
   * Selecciona la mejor evaluación por priorityRank
   */
  private selectBestByPriorityRank(evaluations: RuleEvaluationResult[]): RuleEvaluationResult {
    return evaluations.reduce((best, current) => {
      return current.priorityRank > best.priorityRank ? current : best;
    });
  }

  /**
   * Aplica caps a las evaluaciones (perEventCap y perPeriodCap)
   */
  private async applyCaps(
    evaluations: RuleEvaluationResult[],
    eventDate: Date,
    membershipId: number,
  ): Promise<RuleEvaluationResult[]> {
    if (evaluations.length === 0) {
      return [];
    }

    const results: RuleEvaluationResult[] = [];

    for (const evaluation of evaluations) {
      // Obtener la regla para acceder a los límites
      const rule = await this.ruleRepository.findById(evaluation.ruleId);
      if (!rule) {
        // Si no se encuentra la regla, omitir esta evaluación
        continue;
      }

      const limits = rule.limits;
      let points = evaluation.points;

      // Aplicar perEventCap si está definido
      if (limits?.perEventCap !== null && limits?.perEventCap !== undefined) {
        points = Math.min(points, limits.perEventCap);
      }

      // Aplicar perPeriodCap si está definido
      if (limits?.perPeriodCap !== null && limits?.perPeriodCap !== undefined) {
        // Determinar periodo según periodType
        let startDate: Date;
        const endDate = eventDate;

        if (limits.periodType === 'rolling' && limits.periodDays) {
          // Rolling period: últimos N días desde eventDate
          startDate = new Date(eventDate.getTime() - limits.periodDays * 24 * 60 * 60 * 1000);
        } else if (limits.periodType === 'calendar') {
          // Calendar period: mes actual
          startDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), 1);
        } else if (limits.periodDays) {
          // Por defecto, usar rolling
          startDate = new Date(eventDate.getTime() - limits.periodDays * 24 * 60 * 60 * 1000);
        } else {
          // Sin periodo definido, no aplicar cap
          results.push({ ...evaluation, points });
          continue;
        }

        // Consultar transacciones previas en el periodo
        const previousTransactions =
          await this.pointsTransactionRepository.findEarningsByMembershipAndPeriod(
            membershipId,
            rule.programId,
            rule.id,
            startDate,
            endDate,
          );

        // Calcular puntos ya otorgados en el periodo
        const pointsInPeriod = previousTransactions.reduce((sum, tx) => sum + tx.pointsDelta, 0);

        // Aplicar cap: no exceder el límite del periodo
        const remainingCap = limits.perPeriodCap - pointsInPeriod;
        if (remainingCap <= 0) {
          // Ya se alcanzó el cap del periodo, omitir esta evaluación
          continue;
        }

        // Ajustar puntos para no exceder el cap
        points = Math.min(points, remainingCap);
      }

      // Solo agregar si los puntos son mayores a 0 después de aplicar caps
      if (points > 0) {
        results.push({ ...evaluation, points });
      }
    }

    return results;
  }
}
