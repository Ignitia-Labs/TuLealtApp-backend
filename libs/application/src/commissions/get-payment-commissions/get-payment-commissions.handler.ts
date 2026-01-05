import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICommissionRepository,
  IPaymentRepository,
  IPartnerRepository,
  IUserRepository,
} from '@libs/domain';
import { GetPaymentCommissionsRequest } from './get-payment-commissions.request';
import { GetPaymentCommissionsResponse, CommissionDto } from './get-payment-commissions.response';

/**
 * Handler para el caso de uso de obtener comisiones de un pago
 */
@Injectable()
export class GetPaymentCommissionsHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IPaymentRepository')
    private readonly paymentRepository: IPaymentRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetPaymentCommissionsRequest): Promise<GetPaymentCommissionsResponse> {
    // Verificar que el pago existe
    const payment = await this.paymentRepository.findById(request.paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${request.paymentId} not found`);
    }

    // Obtener comisiones del pago
    const commissions = await this.commissionRepository.findByPaymentId(request.paymentId);

    // Enriquecer con información de usuarios staff y partners
    const commissionDtos = await Promise.all(
      commissions.map(async (commission) => {
        const staffUser = await this.userRepository.findById(commission.staffUserId);
        const partner = await this.partnerRepository.findById(commission.partnerId);

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

    return new GetPaymentCommissionsResponse(
      payment.id,
      payment.amount,
      payment.currency,
      payment.paymentDate,
      commissionDtos,
    );
  }
}
