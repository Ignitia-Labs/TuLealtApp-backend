import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  ITenantRepository,
} from '@libs/domain';
import { ReversalService } from '../../loyalty/reversal.service';
import { CreatePointsReversalRequest } from './create-points-reversal.request';
import { CreatePointsReversalResponse } from './create-points-reversal.response';

/**
 * Handler para crear una reversión de transacción
 */
@Injectable()
export class CreatePointsReversalHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly reversalService: ReversalService,
  ) {}

  async execute(
    request: CreatePointsReversalRequest,
    requestingPartnerId: number,
    createdBy: string,
  ): Promise<CreatePointsReversalResponse> {
    // 1. Validar que la membership existe
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // 2. Validar que el customer pertenece al partner
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }
    if (tenant.partnerId !== requestingPartnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // 3. Validar que la transacción existe y pertenece a la membership
    const originalTransaction = await this.pointsTransactionRepository.findById(
      request.transactionId,
    );
    if (!originalTransaction) {
      throw new NotFoundException(`Transaction with ID ${request.transactionId} not found`);
    }
    if (originalTransaction.membershipId !== request.membershipId) {
      throw new ForbiddenException('Transaction does not belong to the specified membership');
    }

    // 4. Crear reversión usando el servicio
    const reversalTransaction = await this.reversalService.createReversal(
      request.transactionId,
      request.reasonCode,
      createdBy,
      request.metadata,
    );

    // 5. Calcular nuevo balance
    const newBalance = await this.pointsTransactionRepository.calculateBalance(
      request.membershipId,
    );

    return new CreatePointsReversalResponse(reversalTransaction, request.transactionId, newBalance);
  }
}
