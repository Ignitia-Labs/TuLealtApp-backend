import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IRedemptionCodeRepository,
  IRewardRepository,
  ICustomerMembershipRepository,
} from '@libs/domain';
import { GetCustomerRedemptionCodesRequest } from './get-customer-redemption-codes.request';
import {
  GetCustomerRedemptionCodesResponse,
  RedemptionCodeDto,
} from './get-customer-redemption-codes.response';

/**
 * Handler para obtener códigos de canje de un cliente
 */
@Injectable()
export class GetCustomerRedemptionCodesHandler {
  constructor(
    @Inject('IRedemptionCodeRepository')
    private readonly redemptionCodeRepository: IRedemptionCodeRepository,
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  async execute(
    request: GetCustomerRedemptionCodesRequest,
  ): Promise<GetCustomerRedemptionCodesResponse> {
    // 1. Validar que la membership existe
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // 2. Obtener códigos según filtros
    let codes;
    if (request.status) {
      codes = await this.redemptionCodeRepository.findByMembershipIdAndStatus(
        request.membershipId,
        request.status,
      );
    } else {
      codes = await this.redemptionCodeRepository.findByMembershipId(request.membershipId);
    }

    // 3. Obtener información de recompensas para enriquecer los códigos
    const rewardIds = [...new Set(codes.map((c) => c.rewardId))] as number[];
    const rewardsMap = new Map<number, any>();
    for (const rewardId of rewardIds) {
      const reward = await this.rewardRepository.findById(rewardId);
      if (reward) {
        rewardsMap.set(rewardId, reward);
      }
    }

    // 4. Convertir a DTOs
    const codeDtos: RedemptionCodeDto[] = codes.map((code) => {
      const reward = rewardsMap.get(code.rewardId);
      return {
        id: code.id,
        code: code.code,
        transactionId: code.transactionId,
        rewardId: code.rewardId,
        rewardName: reward?.name || 'Unknown',
        status: code.status,
        expiresAt: code.expiresAt,
        usedAt: code.usedAt,
        createdAt: code.createdAt,
      };
    });

    // 5. Aplicar paginación
    const page = request.page || 1;
    const limit = request.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCodes = codeDtos.slice(startIndex, endIndex);

    return new GetCustomerRedemptionCodesResponse(paginatedCodes, codeDtos.length, page, limit);
  }
}
