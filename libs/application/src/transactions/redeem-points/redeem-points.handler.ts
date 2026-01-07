import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ITransactionRepository,
  ICustomerTierRepository,
  ITenantRepository,
  Transaction,
} from '@libs/domain';
import { RedeemPointsRequest } from './redeem-points.request';
import { RedeemPointsResponse } from './redeem-points.response';
import { TransactionDto } from '../get-transactions/get-transactions.response';
import { TierCalculatorHelper } from '../../customer-memberships/helpers/tier-calculator.helper';

/**
 * Handler para canjear puntos (redeem)
 * Resta puntos de la customer_membership y recalcula el tier automáticamente
 */
@Injectable()
export class RedeemPointsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    request: RedeemPointsRequest,
    requestingPartnerId: number,
  ): Promise<RedeemPointsResponse> {
    // Buscar membership por QR code
    const membership = await this.membershipRepository.findByQrCode(request.qrCode);

    if (!membership) {
      throw new NotFoundException(`Customer with QR code ${request.qrCode} not found`);
    }

    // Verificar que el customer esté activo
    if (membership.status !== 'active') {
      throw new ForbiddenException(`Customer membership is ${membership.status}`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== requestingPartnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Verificar que el customer tiene suficientes puntos
    if (membership.points < request.points) {
      throw new BadRequestException(
        `Insufficient points. Customer has ${membership.points} points, but ${request.points} are required`,
      );
    }

    // Actualizar membership: restar puntos y recalcular tier
    const updatedMembership = await TierCalculatorHelper.subtractPointsAndRecalculateTier(
      membership,
      request.points,
      this.tierRepository,
    );

    // Guardar membership actualizada
    const savedMembership = await this.membershipRepository.update(updatedMembership);

    // Crear transacción
    const transaction = Transaction.createRedeem(
      membership.userId,
      request.points,
      request.description,
      {
        ...request.metadata,
        qrCode: request.qrCode,
        tenantId: membership.tenantId,
      },
      savedMembership.id,
    );

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Obtener información del tier para la respuesta
    let tierName: string | null = null;
    if (savedMembership.tierId) {
      const tier = await this.tierRepository.findById(savedMembership.tierId);
      if (tier) {
        tierName = tier.name;
      }
    }

    return new RedeemPointsResponse(
      new TransactionDto(
        savedTransaction.id,
        savedTransaction.userId,
        savedTransaction.membershipId,
        savedTransaction.type,
        savedTransaction.points,
        savedTransaction.description,
        savedTransaction.metadata,
        savedTransaction.status,
        savedTransaction.createdAt,
        savedTransaction.updatedAt,
        savedTransaction.cashierId,
        savedTransaction.transactionDate,
        savedTransaction.transactionAmountTotal,
        savedTransaction.netAmount,
        savedTransaction.taxAmount,
        savedTransaction.itemsCount,
        savedTransaction.transactionReference,
        savedTransaction.pointsEarned,
        savedTransaction.pointsRuleId,
        savedTransaction.pointsMultiplier,
        savedTransaction.basePoints,
        savedTransaction.bonusPoints,
      ),
      savedMembership.points,
      savedMembership.tierId,
      tierName,
    );
  }
}
