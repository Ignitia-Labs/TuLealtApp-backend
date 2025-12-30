import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICommissionRepository,
  IBillingCycleRepository,
  IPartnerRepository,
  IUserRepository,
} from '@libs/domain';
import { GetBillingCycleCommissionsRequest } from './get-billing-cycle-commissions.request';
import {
  GetBillingCycleCommissionsResponse,
} from './get-billing-cycle-commissions.response';
import { CommissionDto } from '../get-payment-commissions/get-payment-commissions.response';

/**
 * Handler para el caso de uso de obtener comisiones de un billing cycle
 */
@Injectable()
export class GetBillingCycleCommissionsHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IBillingCycleRepository')
    private readonly billingCycleRepository: IBillingCycleRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: GetBillingCycleCommissionsRequest,
  ): Promise<GetBillingCycleCommissionsResponse> {
    // Verificar que el billing cycle existe
    const billingCycle = await this.billingCycleRepository.findById(
      request.billingCycleId,
    );

    if (!billingCycle) {
      throw new NotFoundException(
        `Billing cycle with ID ${request.billingCycleId} not found`,
      );
    }

    // Obtener comisiones del billing cycle
    const commissions = await this.commissionRepository.findByBillingCycleId(
      request.billingCycleId,
    );

    // Enriquecer con información de usuarios staff y partners
    const commissionDtos = await Promise.all(
      commissions.map(async (commission) => {
        const staffUser = await this.userRepository.findById(
          commission.staffUserId,
        );
        const partner = await this.partnerRepository.findById(
          commission.partnerId,
        );

        return new CommissionDto(
          commission.id,
          commission.staffUserId,
          staffUser?.name || 'Unknown User',
          staffUser?.email || 'unknown@example.com',
          commission.partnerId,
          partner?.name || 'Unknown Partner',
          commission.commissionPercent,
          commission.commissionAmount,
          commission.status,
          commission.paidDate,
          commission.createdAt,
          commission.currency,
        );
      }),
    );

    return new GetBillingCycleCommissionsResponse(
      billingCycle.id,
      billingCycle.cycleNumber,
      billingCycle.totalAmount,
      billingCycle.currency,
      billingCycle.paymentDate,
      commissionDtos,
    );
  }
}

