import { Injectable, Inject } from '@nestjs/common';
import {
  ICommissionRepository,
  IUserRepository,
  IPartnerRepository,
  CommissionFilters,
} from '@libs/domain';
import { GetPendingDisbursementsRequest } from './get-pending-disbursements.request';
import {
  GetPendingDisbursementsResponse,
  PendingDisbursementDto,
  PartnerDisbursementDto,
} from './get-pending-disbursements.response';

/**
 * Handler para el caso de uso de obtener desembolsos pendientes
 */
@Injectable()
export class GetPendingDisbursementsHandler {
  constructor(
    @Inject('ICommissionRepository')
    private readonly commissionRepository: ICommissionRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPartnerRepository')
    private readonly partnerRepository: IPartnerRepository,
  ) {}

  async execute(request: GetPendingDisbursementsRequest): Promise<GetPendingDisbursementsResponse> {
    const page = request.page || 1;
    const limit = request.limit || 50;

    // Obtener todas las comisiones pendientes
    const filters: CommissionFilters = {
      status: 'pending',
    };

    let allPendingCommissions;

    if (request.staffUserId) {
      allPendingCommissions = await this.commissionRepository.findByStaffUserId(
        request.staffUserId,
        filters,
      );
    } else if (request.partnerId) {
      allPendingCommissions = await this.commissionRepository.findByPartnerId(
        request.partnerId,
        filters,
      );
    } else {
      // Obtener todas las comisiones pendientes cuando no hay filtros específicos
      allPendingCommissions = await this.commissionRepository.findAll(filters);
    }

    // Filtrar por monto mínimo si se especifica
    if (request.minAmount !== undefined) {
      allPendingCommissions = allPendingCommissions.filter(
        (c) => c.commissionAmount >= request.minAmount!,
      );
    }

    // Agrupar por staffUserId
    const staffMap = new Map<number, { commissions: any[]; staffUserId: number }>();

    for (const commission of allPendingCommissions) {
      if (!staffMap.has(commission.staffUserId)) {
        staffMap.set(commission.staffUserId, {
          staffUserId: commission.staffUserId,
          commissions: [],
        });
      }
      staffMap.get(commission.staffUserId)!.commissions.push(commission);
    }

    // Crear DTOs de desembolsos
    const disbursements: PendingDisbursementDto[] = [];

    for (const { staffUserId, commissions } of staffMap.values()) {
      const staffUser = await this.userRepository.findById(staffUserId);

      if (!staffUser) {
        continue; // Saltar si el usuario no existe
      }

      // Agrupar por partner
      const partnerMap = new Map<number, any[]>();

      for (const commission of commissions) {
        if (!partnerMap.has(commission.partnerId)) {
          partnerMap.set(commission.partnerId, []);
        }
        partnerMap.get(commission.partnerId)!.push(commission);
      }

      // Crear DTOs por partner
      const partnerDtos: PartnerDisbursementDto[] = await Promise.all(
        Array.from(partnerMap.entries()).map(async ([partnerId, partnerCommissions]) => {
          const partner = await this.partnerRepository.findById(partnerId);
          const totalAmount = partnerCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

          return new PartnerDisbursementDto(
            partnerId,
            partner?.name || 'Unknown Partner',
            totalAmount,
          );
        }),
      );

      const totalPendingAmount = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const currency = commissions.length > 0 ? commissions[0].currency : 'USD';

      disbursements.push(
        new PendingDisbursementDto(
          staffUserId,
          staffUser.name,
          staffUser.email,
          totalPendingAmount,
          currency,
          commissions.length,
          partnerDtos,
        ),
      );
    }

    // Aplicar paginación
    const total = disbursements.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDisbursements = disbursements.slice(startIndex, endIndex);

    // Calcular resumen
    const totalPendingAmount = disbursements.reduce((sum, d) => sum + d.totalPendingAmount, 0);
    const currency = disbursements.length > 0 ? disbursements[0].currency : 'USD';

    return new GetPendingDisbursementsResponse(
      paginatedDisbursements,
      {
        totalStaff: total,
        totalPendingAmount,
        currency,
      },
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    );
  }
}
