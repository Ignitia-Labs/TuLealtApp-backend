import { Injectable } from '@nestjs/common';
import { Goal, GoalStatus } from '@libs/domain';
import {
  ProgressInfo,
  ProjectionInfo,
  TrendInfo,
} from './get-goal-progress/get-goal-progress.response';

/**
 * Servicio para calcular el progreso de metas
 */
@Injectable()
export class GoalProgressService {
  /**
   * Calcula el progreso de una meta
   */
  calculateProgress(goal: Goal, currentValue: number): ProgressInfo {
    const progress = goal.calculateProgress(currentValue);

    return {
      currentValue,
      targetValue: goal.targetValue,
      progress,
    };
  }

  /**
   * Calcula la proyección de una meta basada en el progreso actual
   */
  calculateProjection(goal: Goal, currentValue: number, currentDate: Date): ProjectionInfo {
    const periodStart = goal.periodStart;
    const periodEnd = goal.periodEnd;
    const totalPeriodDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const elapsedDays = Math.ceil(
      (currentDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (elapsedDays <= 0) {
      // Si aún no ha comenzado el período
      return {
        projectedValue: 0,
        projectedProgress: 0,
      };
    }

    if (elapsedDays >= totalPeriodDays) {
      // Si el período ya terminó
      return {
        projectedValue: currentValue,
        projectedProgress: goal.calculateProgress(currentValue),
      };
    }

    // Calcular tasa diaria promedio
    const dailyRate = currentValue / elapsedDays;
    const remainingDays = totalPeriodDays - elapsedDays;
    const projectedValue = currentValue + dailyRate * remainingDays;
    const projectedProgress = goal.calculateProgress(projectedValue);

    return {
      projectedValue,
      projectedProgress,
    };
  }

  /**
   * Determina el estado de una meta basado en la proyección
   */
  determineStatus(goal: Goal, projection: number): GoalStatus {
    const currentProgress = goal.calculateProgress(
      goal.calculateCurrentValue({
        mrr: 0,
        arr: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        retentionRate: 0,
        newSubscriptions: 0,
        upgrades: 0,
      }),
    );

    return goal.determineStatus(currentProgress, projection);
  }

  /**
   * Calcula la tendencia comparando el valor actual con un valor anterior
   */
  calculateTrend(goal: Goal, currentValue: number, previousValue: number): TrendInfo {
    const change = currentValue - previousValue;
    const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    return {
      change,
      changePercentage,
    };
  }
}
