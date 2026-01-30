import { Injectable, Inject } from '@nestjs/common';
import {
  IPointsTransactionRepository,
  PointsTransaction,
  ICustomerMembershipRepository,
} from '@libs/domain';

export interface StreakResult {
  streakType: 'VISIT' | 'PURCHASE' | 'MIXED';
  streakCount: number; // Número de días consecutivos
  periodStart: Date;
  periodEnd: Date;
  firstStreakDate: Date | null; // Fecha del primer día del streak
  lastStreakDate: Date | null; // Fecha del último día del streak
  metadata?: Record<string, any>;
}

/**
 * Servicio para calcular streaks de retención desde el ledger
 * Calcula rachas consecutivas de visitas o compras en diferentes ventanas de tiempo
 */
@Injectable()
export class RetentionCalculator {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  /**
   * Calcula el streak de retención para una membership
   * @param membershipId ID de la membership
   * @param streakType Tipo de streak a calcular (VISIT, PURCHASE, MIXED)
   * @param windowType Tipo de ventana ('monthly' o 'rolling')
   * @param windowDays Días de la ventana (30 para rolling, null para monthly)
   * @returns Resultado del streak calculado
   */
  async calculateStreak(
    membershipId: number,
    streakType: 'VISIT' | 'PURCHASE' | 'MIXED',
    windowType: 'monthly' | 'rolling' = 'rolling',
    windowDays: number = 30,
  ): Promise<StreakResult | null> {
    // Verificar que la membership existe
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    // Determinar rango de fechas según ventana
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    if (windowType === 'monthly') {
      // Mes calendario actual
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // Rolling window (últimos N días)
      periodStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    }

    // Obtener transacciones en el periodo
    const transactions = await this.pointsTransactionRepository.findForTierEvaluation(
      membershipId,
      periodStart,
      periodEnd,
    );

    // Filtrar transacciones según tipo de streak
    const relevantTransactions = this.filterTransactionsByStreakType(transactions, streakType);

    if (relevantTransactions.length === 0) {
      return null; // No hay streak
    }

    // Calcular streak consecutivo
    const streak = this.calculateConsecutiveStreak(relevantTransactions, periodStart, periodEnd);

    return {
      streakType,
      streakCount: streak.count,
      periodStart,
      periodEnd,
      firstStreakDate: streak.firstDate,
      lastStreakDate: streak.lastDate,
      metadata: {
        totalTransactions: relevantTransactions.length,
        windowType,
        windowDays: windowType === 'rolling' ? windowDays : null,
      },
    };
  }

  /**
   * Filtra transacciones según el tipo de streak
   */
  private filterTransactionsByStreakType(
    transactions: PointsTransaction[],
    streakType: 'VISIT' | 'PURCHASE' | 'MIXED',
  ): PointsTransaction[] {
    return transactions.filter((tx) => {
      // Solo transacciones de tipo EARNING
      if (tx.type !== 'EARNING') {
        return false;
      }

      // Verificar metadata o reasonCode para determinar el tipo de evento
      const eventType = tx.metadata?.eventType || tx.reasonCode?.split('_')[0] || '';

      if (streakType === 'VISIT') {
        return eventType === 'VISIT' || tx.reasonCode === 'BASE_VISIT';
      } else if (streakType === 'PURCHASE') {
        return eventType === 'PURCHASE' || tx.reasonCode === 'BASE_PURCHASE';
      } else {
        // MIXED: acepta VISIT o PURCHASE
        return (
          eventType === 'VISIT' ||
          eventType === 'PURCHASE' ||
          tx.reasonCode === 'BASE_VISIT' ||
          tx.reasonCode === 'BASE_PURCHASE'
        );
      }
    });
  }

  /**
   * Calcula el streak consecutivo más largo en el periodo
   * Un streak es una secuencia de días consecutivos con al menos una transacción
   */
  private calculateConsecutiveStreak(
    transactions: PointsTransaction[],
    periodStart: Date,
    periodEnd: Date,
  ): { count: number; firstDate: Date | null; lastDate: Date | null } {
    if (transactions.length === 0) {
      return { count: 0, firstDate: null, lastDate: null };
    }

    // Agrupar transacciones por día (normalizar a fecha sin hora)
    const transactionsByDay = new Map<string, PointsTransaction[]>();

    for (const tx of transactions) {
      const dayKey = this.getDayKey(tx.createdAt);
      if (!transactionsByDay.has(dayKey)) {
        transactionsByDay.set(dayKey, []);
      }
      transactionsByDay.get(dayKey)!.push(tx);
    }

    // Ordenar días
    const sortedDays = Array.from(transactionsByDay.keys()).sort();

    if (sortedDays.length === 0) {
      return { count: 0, firstDate: null, lastDate: null };
    }

    // Calcular streak consecutivo más largo
    let maxStreak = 1;
    let currentStreak = 1;
    let maxStreakStart = sortedDays[0];
    let maxStreakEnd = sortedDays[0];
    let currentStreakStart = sortedDays[0];

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDay = this.parseDayKey(sortedDays[i - 1]);
      const currDay = this.parseDayKey(sortedDays[i]);
      const daysDiff = Math.floor((currDay.getTime() - prevDay.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff === 1) {
        // Días consecutivos
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          maxStreakStart = currentStreakStart;
          maxStreakEnd = sortedDays[i];
        }
      } else {
        // Streak roto, reiniciar
        currentStreak = 1;
        currentStreakStart = sortedDays[i];
      }
    }

    return {
      count: maxStreak,
      firstDate: this.parseDayKey(maxStreakStart),
      lastDate: this.parseDayKey(maxStreakEnd),
    };
  }

  /**
   * Convierte una fecha a una clave de día (YYYY-MM-DD)
   */
  private getDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parsea una clave de día de vuelta a Date
   */
  private parseDayKey(dayKey: string): Date {
    const [year, month, day] = dayKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Calcula streaks para múltiples memberships (útil para jobs batch)
   */
  async calculateStreaksForMemberships(
    membershipIds: number[],
    streakType: 'VISIT' | 'PURCHASE' | 'MIXED',
    windowType: 'monthly' | 'rolling' = 'rolling',
    windowDays: number = 30,
  ): Promise<Map<number, StreakResult | null>> {
    const results = new Map<number, StreakResult | null>();

    for (const membershipId of membershipIds) {
      try {
        const streak = await this.calculateStreak(membershipId, streakType, windowType, windowDays);
        results.set(membershipId, streak);
      } catch (error) {
        // Log error pero continuar con otros memberships
        console.warn(`Error calculating streak for membership ${membershipId}:`, error);
        results.set(membershipId, null);
      }
    }

    return results;
  }
}
