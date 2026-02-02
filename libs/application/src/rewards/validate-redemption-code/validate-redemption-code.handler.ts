import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  IRedemptionCodeRepository,
  IRewardRepository,
  IPointsTransactionRepository,
  ITenantRepository,
  IUserRepository,
} from '@libs/domain';
import { ValidateRedemptionCodeRequest } from './validate-redemption-code.request';
import { ValidateRedemptionCodeResponse } from './validate-redemption-code.response';

/**
 * Handler para validar un código de canje
 */
@Injectable()
export class ValidateRedemptionCodeHandler {
  constructor(
    @Inject('IRedemptionCodeRepository')
    private readonly redemptionCodeRepository: IRedemptionCodeRepository,
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    request: ValidateRedemptionCodeRequest,
    userId: number, // userId del partner que valida el código
  ): Promise<ValidateRedemptionCodeResponse> {
    // 1. Buscar código por código único
    const redemptionCode = await this.redemptionCodeRepository.findByCode(request.code);
    if (!redemptionCode) {
      throw new NotFoundException(`Redemption code "${request.code}" not found`);
    }

    // 2. Obtener usuario que valida el código para verificar su partnerId
    const validatingUser = await this.userRepository.findById(userId);
    if (!validatingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!validatingUser.partnerId) {
      throw new ForbiddenException('User does not belong to a partner');
    }

    // 3. Validar que el código pertenece al tenant del partner
    const tenant = await this.tenantRepository.findById(redemptionCode.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${redemptionCode.tenantId} not found`);
    }

    if (tenant.partnerId !== validatingUser.partnerId) {
      throw new ForbiddenException(
        'This redemption code does not belong to your partner',
      );
    }

    // 4. Validar que el código es válido para usar
    if (!redemptionCode.isValid()) {
      if (redemptionCode.isExpired()) {
        throw new BadRequestException('This redemption code has expired');
      }
      if (redemptionCode.status !== 'pending') {
        throw new BadRequestException(
          `This redemption code has already been ${redemptionCode.status}`,
        );
      }
      throw new BadRequestException('This redemption code is not valid');
    }

    // 5. Obtener información de la recompensa
    const reward = await this.rewardRepository.findById(redemptionCode.rewardId);
    if (!reward) {
      throw new NotFoundException(
        `Reward with ID ${redemptionCode.rewardId} not found`,
      );
    }

    // 6. Obtener información de la transacción
    const transaction = await this.pointsTransactionRepository.findById(
      redemptionCode.transactionId,
    );
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${redemptionCode.transactionId} not found`,
      );
    }

    // 7. Marcar código como usado
    const updatedCode = redemptionCode.markAsUsed(userId);
    await this.redemptionCodeRepository.update(updatedCode);

    // 8. Retornar respuesta con información completa
    return new ValidateRedemptionCodeResponse({
      redemptionCodeId: updatedCode.id,
      code: updatedCode.code,
      transactionId: updatedCode.transactionId,
      rewardId: updatedCode.rewardId,
      rewardName: reward.name,
      rewardCategory: reward.category,
      pointsUsed: Math.abs(transaction.pointsDelta),
      membershipId: updatedCode.membershipId,
      status: updatedCode.status,
      usedAt: updatedCode.usedAt,
    });
  }
}
