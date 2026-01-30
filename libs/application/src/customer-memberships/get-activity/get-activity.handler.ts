import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  ITierStatusRepository,
} from '@libs/domain';
import { GetActivityRequest } from './get-activity.request';
import { GetActivityResponse, ActivityItemDto } from './get-activity.response';

/**
 * Handler para obtener actividad reciente de una membership
 */
@Injectable()
export class GetActivityHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITierStatusRepository')
    private readonly tierStatusRepository: ITierStatusRepository,
  ) {}

  async execute(request: GetActivityRequest, userId: number): Promise<GetActivityResponse> {
    // Obtener membership y validar ownership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // Validar que la membership pertenece al usuario
    if (membership.userId !== userId) {
      throw new NotFoundException(
        `Membership ${request.membershipId} does not belong to user ${userId}`,
      );
    }

    const activities: ActivityItemDto[] = [];

    // Obtener transacciones recientes si se solicitan
    if (request.type === 'transactions' || request.type === 'all') {
      const transactions = await this.pointsTransactionRepository.findByMembershipId(
        request.membershipId,
      );

      // Ordenar por fecha descendente y tomar las más recientes
      transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const recentTransactions = transactions.slice(0, request.limit || 10);

      for (const tx of recentTransactions) {
        activities.push({
          type: 'transaction',
          activityType: tx.type,
          description: this.getTransactionDescription(tx),
          pointsDelta: tx.pointsDelta,
          occurredAt: tx.createdAt,
          metadata: tx.metadata,
        });
      }
    }

    // Obtener cambios de tier si se solicitan
    if (request.type === 'tier_changes' || request.type === 'all') {
      const tierStatus = await this.tierStatusRepository.findByMembershipId(request.membershipId);

      if (tierStatus && tierStatus.currentTierId) {
        activities.push({
          type: 'tier_change',
          activityType: 'TIER_ASSIGNED',
          description: `Tier asignado desde ${tierStatus.since.toISOString()}`,
          pointsDelta: null,
          occurredAt: tierStatus.since,
          metadata: { tierId: tierStatus.currentTierId },
        });
      }
    }

    // Ordenar todas las actividades por fecha descendente
    activities.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    // Limitar resultados
    const limit = request.limit || 10;
    const limitedActivities = activities.slice(0, limit);

    return new GetActivityResponse(limitedActivities);
  }

  private getTransactionDescription(tx: any): string {
    const typeMap: Record<string, string> = {
      EARNING: 'Puntos otorgados',
      REDEEM: 'Puntos canjeados',
      ADJUSTMENT: 'Ajuste de puntos',
      REVERSAL: 'Reversión de puntos',
      EXPIRATION: 'Puntos expirados',
    };

    const baseDescription = typeMap[tx.type] || 'Transacción de puntos';
    if (tx.reasonCode) {
      return `${baseDescription}: ${tx.reasonCode}`;
    }
    return baseDescription;
  }
}
