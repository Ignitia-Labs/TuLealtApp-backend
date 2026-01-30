import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  ITenantRepository,
} from '@libs/domain';
import { AdjustmentService } from '../../loyalty/adjustment.service';
import { CreatePointsAdjustmentRequest } from './create-points-adjustment.request';
import { CreatePointsAdjustmentResponse } from './create-points-adjustment.response';

/**
 * Handler para crear un ajuste manual de puntos
 * Solo usuarios ADMIN pueden crear ajustes
 */
@Injectable()
export class CreatePointsAdjustmentHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly adjustmentService: AdjustmentService,
  ) {}

  async execute(
    request: CreatePointsAdjustmentRequest,
    requestingPartnerId: number,
    createdBy: string,
  ): Promise<CreatePointsAdjustmentResponse> {
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

    // 3. Crear ajuste usando el servicio
    const adjustmentTransaction = await this.adjustmentService.createAdjustment(
      request.membershipId,
      request.pointsDelta,
      request.reasonCode,
      createdBy,
      request.metadata,
    );

    // 4. Calcular nuevo balance
    const newBalance = await this.pointsTransactionRepository.calculateBalance(
      request.membershipId,
    );

    return new CreatePointsAdjustmentResponse(adjustmentTransaction, newBalance);
  }
}
