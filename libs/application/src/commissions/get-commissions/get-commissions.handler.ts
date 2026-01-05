import { Injectable, Inject } from '@nestjs/common';
import {
  ICommissionRepository,
  IPartnerRepository,
  IUserRepository,
  CommissionFilters,
} from '@libs/domain';
import { GetCommissionsRequest } from './get-commissions.request';
import { GetCommissionsResponse } from './get-commissions.response';
import { CommissionDto } from '../get-payment-commissions/get-payment-commissions.response';

/**
 * Handler para el caso de uso de obtener comisiones con filtros
 */
@Injectable()
export class GetCommissionsHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: GetCommissionsRequest): Promise<GetCommissionsResponse> {
    // Preparar filtros
    const filters: CommissionFilters = {
      status: request.status,
      startDate: request.startDate ? new Date(request.startDate) : undefined,
      endDate: request.endDate ? new Date(request.endDate) : undefined,
    };

    const page = request.page || 1;
    const limit = request.limit || 50;
    const skip = (page - 1) * limit;

    filters.skip = skip;
    filters.take = limit;

    // Obtener comisiones según los filtros
    let commissions;
    let total: number;

    if (request.staffUserId) {
      commissions = await this.commissionRepository.findByStaffUserId(request.staffUserId, filters);
      total = await this.commissionRepository.countByStaffUserId(request.staffUserId, filters);
    } else if (request.partnerId) {
      commissions = await this.commissionRepository.findByPartnerId(request.partnerId, filters);
      total = await this.commissionRepository.countByPartnerId(request.partnerId, filters);
    } else {
      // Si no hay filtros específicos, obtener todas las comisiones
      commissions = await this.commissionRepository.findAll(filters);
      total = await this.commissionRepository.count(filters);
    }

    // Enriquecer con información de usuarios y partners
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

    // Calcular resumen
    // Nota: Si hay múltiples monedas, se usa la del primer elemento
    // En un escenario real, se deberían agrupar por moneda o convertir a una moneda base
    const summary = {
      totalPending: commissionDtos.filter((c) => c.status === 'pending').length,
      totalPaid: commissionDtos.filter((c) => c.status === 'paid').length,
      totalCancelled: commissionDtos.filter((c) => c.status === 'cancelled').length,
      totalAmount: commissionDtos.reduce((sum, c) => sum + c.commissionAmount, 0),
      currency: commissionDtos.length > 0 ? commissionDtos[0].currency : 'USD',
    };

    // Obtener información adicional si se filtró por staff o partner
    let staffUserName: string | undefined;
    let partnerName: string | undefined;

    if (request.staffUserId) {
      const staffUser = await this.userRepository.findById(request.staffUserId);
      staffUserName = staffUser?.name;
    }

    if (request.partnerId) {
      const partner = await this.partnerRepository.findById(request.partnerId);
      partnerName = partner?.name;
    }

    return new GetCommissionsResponse(
      commissionDtos,
      summary,
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      request.staffUserId,
      staffUserName,
      request.partnerId,
      partnerName,
    );
  }
}
