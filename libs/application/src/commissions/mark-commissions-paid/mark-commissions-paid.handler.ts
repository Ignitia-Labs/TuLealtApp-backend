import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ICommissionRepository,
  IPartnerRepository,
  IUserRepository,
} from '@libs/domain';
import { MarkCommissionsPaidRequest } from './mark-commissions-paid.request';
import { MarkCommissionsPaidResponse } from './mark-commissions-paid.response';
import { CommissionDto } from '../get-payment-commissions/get-payment-commissions.response';

/**
 * Handler para el caso de uso de marcar comisiones como pagadas
 */
@Injectable()
export class MarkCommissionsPaidHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: MarkCommissionsPaidRequest,
  ): Promise<MarkCommissionsPaidResponse> {
    if (request.commissionIds.length === 0) {
      throw new BadRequestException('At least one commission ID is required');
    }

    const paidDate = request.paidDate ? new Date(request.paidDate) : new Date();

    // Obtener y actualizar cada comisión
    const updatedCommissions = [];
    const errors: string[] = [];

    for (const commissionId of request.commissionIds) {
      const commission = await this.commissionRepository.findById(commissionId);

      if (!commission) {
        errors.push(`Commission with ID ${commissionId} not found`);
        continue;
      }

      if (commission.status === 'paid') {
        errors.push(`Commission with ID ${commissionId} is already paid`);
        continue;
      }

      if (commission.status === 'cancelled') {
        errors.push(`Cannot mark cancelled commission ${commissionId} as paid`);
        continue;
      }

      try {
        const updatedCommission = commission.markAsPaid(paidDate, request.notes || null);
        const savedCommission = await this.commissionRepository.update(
          updatedCommission,
        );

        // Enriquecer con información del usuario y partner
        const staffUser = await this.userRepository.findById(
          savedCommission.staffUserId,
        );
        const partner = await this.partnerRepository.findById(
          savedCommission.partnerId,
        );

        updatedCommissions.push(
          new CommissionDto(
            savedCommission.id,
            savedCommission.staffUserId,
            staffUser?.name || 'Unknown User',
            staffUser?.email || 'unknown@example.com',
            savedCommission.partnerId,
            partner?.name || 'Unknown Partner',
            savedCommission.commissionPercent,
            savedCommission.commissionAmount,
            savedCommission.status,
            savedCommission.paidDate,
            savedCommission.createdAt,
            savedCommission.currency,
          ),
        );
      } catch (error) {
        errors.push(`Error updating commission ${commissionId}: ${error.message}`);
      }
    }

    if (errors.length > 0 && updatedCommissions.length === 0) {
      throw new BadRequestException(
        `Failed to update commissions: ${errors.join('; ')}`,
      );
    }

    return new MarkCommissionsPaidResponse(
      updatedCommissions.length,
      updatedCommissions,
    );
  }
}

