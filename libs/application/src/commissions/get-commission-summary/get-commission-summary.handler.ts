import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ICommissionRepository,
  IUserRepository,
  IPartnerRepository,
  CommissionFilters,
} from '@libs/domain';
import { GetCommissionSummaryRequest } from './get-commission-summary.request';
import {
  GetCommissionSummaryResponse,
  CommissionByPartnerDto,
} from './get-commission-summary.response';

/**
 * Handler para el caso de uso de obtener resumen de comisiones
 */
@Injectable()
export class GetCommissionSummaryHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(
    request: GetCommissionSummaryRequest,
  ): Promise<GetCommissionSummaryResponse> {
    // Verificar que el usuario staff existe
    const staffUser = await this.userRepository.findById(request.staffUserId);

    if (!staffUser) {
      throw new NotFoundException(
        `Staff user with ID ${request.staffUserId} not found`,
      );
    }

    // Preparar fechas del período
    const startDate = request.startDate
      ? new Date(request.startDate)
      : new Date(new Date().getFullYear(), 0, 1); // Inicio del año actual
    const endDate = request.endDate
      ? new Date(request.endDate)
      : new Date(); // Hoy

    // Obtener todas las comisiones del staff en el período
    const filters: CommissionFilters = {
      startDate,
      endDate,
    };

    const allCommissions = await this.commissionRepository.findByStaffUserId(
      request.staffUserId,
      filters,
    );

    // Calcular resumen
    const pendingCommissions = allCommissions.filter((c) => c.status === 'pending');
    const paidCommissions = allCommissions.filter((c) => c.status === 'paid');
    const cancelledCommissions = allCommissions.filter(
      (c) => c.status === 'cancelled',
    );

    const pendingAmount = pendingCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );
    const paidAmount = paidCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );
    const totalAmount = allCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );

    const currency =
      allCommissions.length > 0 ? allCommissions[0].currency : 'USD';

    // Agrupar por partner
    const partnerMap = new Map<number, { commissions: any[]; partnerId: number }>();

    for (const commission of allCommissions) {
      if (!partnerMap.has(commission.partnerId)) {
        partnerMap.set(commission.partnerId, {
          partnerId: commission.partnerId,
          commissions: [],
        });
      }
      partnerMap.get(commission.partnerId)!.commissions.push(commission);
    }

    // Crear DTOs por partner
    const byPartner = await Promise.all(
      Array.from(partnerMap.values()).map(async ({ partnerId, commissions }) => {
        const partner = await this.partnerRepository.findById(partnerId);
        const totalAmount = commissions.reduce(
          (sum, c) => sum + c.commissionAmount,
          0,
        );

        return new CommissionByPartnerDto(
          partnerId,
          partner?.name || 'Unknown Partner',
          commissions.length,
          totalAmount,
        );
      }),
    );

    return new GetCommissionSummaryResponse(
      request.staffUserId,
      staffUser.name,
      { startDate, endDate },
      {
        totalCommissions: allCommissions.length,
        pendingCommissions: pendingCommissions.length,
        paidCommissions: paidCommissions.length,
        cancelledCommissions: cancelledCommissions.length,
        totalAmount,
        pendingAmount,
        paidAmount,
        currency,
      },
      byPartner,
    );
  }
}

