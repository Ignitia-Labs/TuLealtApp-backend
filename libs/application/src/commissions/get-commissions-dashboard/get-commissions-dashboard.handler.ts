import { Injectable, Inject } from '@nestjs/common';
import {
  ICommissionRepository,
  IUserRepository,
  IPartnerRepository,
} from '@libs/domain';
import { GetCommissionsDashboardRequest } from './get-commissions-dashboard.request';
import {
  GetCommissionsDashboardResponse,
  PeriodStatsDto,
  TopStaffDto,
  TopPartnerDto,
} from './get-commissions-dashboard.response';

/**
 * Handler para el caso de uso de obtener dashboard de comisiones
 */
@Injectable()
export class GetCommissionsDashboardHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(
    request: GetCommissionsDashboardRequest,
  ): Promise<GetCommissionsDashboardResponse> {
    // Preparar fechas del período
    const endDate = request.endDate
      ? new Date(request.endDate)
      : new Date();
    const startDate = request.startDate
      ? new Date(request.startDate)
      : new Date(new Date().getFullYear(), 0, 1); // Inicio del año actual

    // Calcular período anterior para comparación
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodDuration);

    // Obtener todas las comisiones del período
    const allCommissions = await this.commissionRepository.findAll({
      startDate,
      endDate,
    });

    // Calcular resumen general
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
    const cancelledAmount = cancelledCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );
    const totalAmount = allCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );

    const currency =
      allCommissions.length > 0 ? allCommissions[0].currency : 'USD';
    const averageCommissionAmount =
      allCommissions.length > 0 ? totalAmount / allCommissions.length : 0;

    // Obtener estadísticas por período
    const periodGroup = request.periodGroup || 'monthly';
    const periodStatsRaw = await this.commissionRepository.getStatsByPeriod(
      startDate,
      endDate,
      periodGroup,
    );
    const periodStats = periodStatsRaw.map(
      (stat) =>
        new PeriodStatsDto(
          stat.period,
          stat.totalCommissions,
          stat.totalAmount,
          stat.pendingCommissions,
          stat.paidCommissions,
          stat.currency,
        ),
    );

    // Obtener top staff
    const topStaffLimit = request.topStaffLimit || 10;
    const staffStatsRaw = await this.commissionRepository.getStatsByStaff(
      startDate,
      endDate,
      topStaffLimit,
    );

    const topStaff = await Promise.all(
      staffStatsRaw.map(async (stat) => {
        const staffUser = await this.userRepository.findById(stat.staffUserId);
        return new TopStaffDto(
          stat.staffUserId,
          staffUser?.name || 'Unknown User',
          staffUser?.email || 'unknown@example.com',
          stat.totalCommissions,
          stat.totalAmount,
          stat.pendingAmount,
          stat.paidAmount,
          stat.currency,
        );
      }),
    );

    // Obtener top partners
    const topPartnersLimit = request.topPartnersLimit || 10;
    const partnerStatsRaw = await this.commissionRepository.getStatsByPartner(
      startDate,
      endDate,
      topPartnersLimit,
    );

    const topPartners = await Promise.all(
      partnerStatsRaw.map(async (stat) => {
        const partner = await this.partnerRepository.findById(stat.partnerId);
        return new TopPartnerDto(
          stat.partnerId,
          partner?.name || 'Unknown Partner',
          stat.totalCommissions,
          stat.totalAmount,
          stat.currency,
        );
      }),
    );

    // Calcular comparación con período anterior
    const previousCommissions = await this.commissionRepository.findAll({
      startDate: previousStartDate,
      endDate: previousEndDate,
    });

    const previousTotalAmount = previousCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0,
    );

    const totalCommissionsChange =
      allCommissions.length - previousCommissions.length;
    const totalAmountChange = totalAmount - previousTotalAmount;
    const percentageChange =
      previousTotalAmount > 0
        ? (totalAmountChange / previousTotalAmount) * 100
        : 0;

    return new GetCommissionsDashboardResponse(
      { startDate, endDate },
      {
        totalCommissions: allCommissions.length,
        pendingCommissions: pendingCommissions.length,
        paidCommissions: paidCommissions.length,
        cancelledCommissions: cancelledCommissions.length,
        totalAmount,
        pendingAmount,
        paidAmount,
        cancelledAmount,
        averageCommissionAmount,
        currency,
      },
      periodStats,
      topStaff,
      topPartners,
      {
        totalCommissionsChange,
        totalAmountChange,
        percentageChange,
      },
    );
  }
}




