import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICustomerMembershipRepository, IPointsTransactionRepository } from '@libs/domain';
import { GetPointsBalanceRequest } from './get-points-balance.request';
import { GetPointsBalanceResponse, ExpiringPointsDto } from './get-points-balance.response';

/**
 * Handler para obtener el balance de puntos de una membership
 */
@Injectable()
export class GetPointsBalanceHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  async execute(
    request: GetPointsBalanceRequest,
    userId: number,
  ): Promise<GetPointsBalanceResponse> {
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

    // Obtener balance actual (usar proyección de membership)
    const currentBalance = membership.points;

    // Calcular puntos pendientes (transacciones con status pending si existe)
    // Por ahora, asumimos que no hay puntos pendientes
    const pendingPoints = 0;

    // Buscar puntos próximos a expirar (próximos 30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringTransactions = await this.pointsTransactionRepository.findExpiringTransactions(
      request.membershipId,
      thirtyDaysFromNow,
    );

    // Filtrar solo transacciones EARNING con puntos positivos y que aún no han expirado
    const now = new Date();
    const expiringSoon: ExpiringPointsDto[] = expiringTransactions
      .filter(
        (tx) => tx.type === 'EARNING' && tx.pointsDelta > 0 && tx.expiresAt && tx.expiresAt > now,
      )
      .map((tx) => ({
        points: tx.pointsDelta,
        expiresAt: tx.expiresAt!,
      }));

    return new GetPointsBalanceResponse(
      request.membershipId,
      currentBalance,
      pendingPoints,
      expiringSoon,
      membership.updatedAt,
    );
  }
}
