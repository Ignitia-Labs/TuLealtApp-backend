import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  IRewardRepository,
  ICustomerMembershipRepository,
  IPointsTransactionRepository,
  ITenantRepository,
  ILoyaltyProgramRepository,
  IEnrollmentRepository,
  IRedemptionCodeRepository,
  PointsTransaction,
  RedemptionCode,
} from '@libs/domain';
import { BalanceSyncService } from '../../loyalty/balance-sync.service';
import { LoyaltyProgramConfigResolver } from '../../loyalty/loyalty-program-config-resolver.service';
import { RedeemRewardRequest } from './redeem-reward.request';
import { RedeemRewardResponse } from './redeem-reward.response';
import { RedeemRewardCodeGeneratorService } from './redeem-reward-code-generator.service';

/**
 * Handler para canjear una recompensa
 */
@Injectable()
export class RedeemRewardHandler {
  constructor(
    @Inject('IRewardRepository')
    private readonly rewardRepository: IRewardRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('IEnrollmentRepository')
    private readonly enrollmentRepository: IEnrollmentRepository,
    @Inject('IRedemptionCodeRepository')
    private readonly redemptionCodeRepository: IRedemptionCodeRepository,
    private readonly balanceSyncService: BalanceSyncService,
    private readonly configResolver: LoyaltyProgramConfigResolver,
    private readonly codeGenerator: RedeemRewardCodeGeneratorService,
  ) {}

  async execute(request: RedeemRewardRequest): Promise<RedeemRewardResponse> {
    // 1. Obtener recompensa
    const reward = await this.rewardRepository.findById(request.rewardId);
    if (!reward) {
      throw new NotFoundException(`Reward with ID ${request.rewardId} not found`);
    }

    // 2. Obtener membership
    const membership = await this.membershipRepository.findById(request.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership with ID ${request.membershipId} not found`);
    }

    // 3. Validar que membership pertenece al tenant de la recompensa
    if (membership.tenantId !== reward.tenantId) {
      throw new BadRequestException(
        `Reward belongs to tenant ${reward.tenantId}, but membership belongs to tenant ${membership.tenantId}`,
      );
    }

    // 4. Validar que membership está activa
    if (membership.status !== 'active') {
      throw new BadRequestException(
        `Membership is ${membership.status}. Only active memberships can redeem rewards.`,
      );
    }

    // 5. Verificar balance suficiente
    if (membership.points < reward.pointsRequired) {
      throw new BadRequestException(
        `Insufficient points. Required: ${reward.pointsRequired}, Available: ${membership.points}`,
      );
    }

    // 6. Validar minPointsToRedeem (del tenant o programa)
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    // Buscar enrollment activo en programa BASE para obtener minPointsToRedeem
    const baseEnrollments = await this.enrollmentRepository.findActiveByMembershipIdAndProgramType(
      membership.id,
      'BASE',
    );

    let program = null;
    if (baseEnrollments.length > 0) {
      // Usar el primer enrollment BASE activo
      program = await this.programRepository.findById(baseEnrollments[0].programId);
    }

    const minPointsToRedeem = this.configResolver.resolveMinPointsToRedeem(program, tenant);
    if (reward.pointsRequired < minPointsToRedeem) {
      throw new BadRequestException(
        `Reward requires ${reward.pointsRequired} points, but minimum to redeem is ${minPointsToRedeem} points`,
      );
    }

    // 7. Verificar disponibilidad de la recompensa
    if (!reward.isAvailable()) {
      throw new BadRequestException('Reward is not available (out of stock, expired, or inactive)');
    }

    // 8. Verificar límite por usuario (contar redemptions previas)
    // Usar método optimizado con filtro directo en BD en lugar de filtrar en memoria
    const redemptionTransactions = await this.pointsTransactionRepository.findByMembershipIdAndTypeAndRewardId(
      membership.id,
      'REDEEM',
      reward.id,
    );

    const userRedemptions = redemptionTransactions.length;

    if (!reward.canRedeem(userRedemptions, membership.points)) {
      throw new BadRequestException(
        `Cannot redeem: ${
          reward.maxRedemptionsPerUser
            ? `limit of ${reward.maxRedemptionsPerUser} redemptions reached`
            : 'insufficient points'
        }`,
      );
    }

    // 9. Crear transacción REDEEM en el ledger
    const idempotencyKey = `REDEEM-${request.membershipId}-${request.rewardId}-${Date.now()}`;

    // Verificar idempotencia
    const existingTransaction =
      await this.pointsTransactionRepository.findByIdempotencyKey(idempotencyKey);
    if (existingTransaction) {
      // Ya existe, verificar si tiene código asociado
      const existingCode = await this.redemptionCodeRepository.findByTransactionId(
        existingTransaction.id,
      );
      const updatedMembership = await this.membershipRepository.findById(request.membershipId);
      return new RedeemRewardResponse({
        transactionId: existingTransaction.id,
        rewardId: reward.id,
        pointsUsed: Math.abs(existingTransaction.pointsDelta),
        newBalance: updatedMembership?.points || membership.points,
        redemptionCode: existingCode?.code,
      });
    }

    // Las recompensas son globales del tenant, no específicas de un programa
    // Por lo tanto, programId es null en la transacción REDEEM
    const transaction = PointsTransaction.createRedeem(
      membership.tenantId,
      membership.userId,
      membership.id,
      -reward.pointsRequired, // Negativo para REDEEM
      idempotencyKey,
      reward.id, // rewardId ahora es parámetro requerido, no va en metadata
      null, // sourceEventId
      null, // correlationId
      null, // createdBy (se puede obtener del contexto)
      'REWARD_REDEMPTION', // reasonCode
      null, // programId: null porque las recompensas son globales del tenant
      {
        // metadata solo para auditoría (sin rewardId que ahora es columna)
        rewardName: reward.name,
        rewardCategory: reward.category,
      },
    );

    const savedTransaction = await this.pointsTransactionRepository.save(transaction);

    // 10. Generar código único de canje (después de guardar transacción)
    // Verificar si ya existe código para esta transacción (idempotencia)
    let existingCode = await this.redemptionCodeRepository.findByTransactionId(
      savedTransaction.id,
    );
    let redemptionCode: string | undefined;

    if (!existingCode) {
      // Generar nuevo código
      const codeString = await this.codeGenerator.generateUniqueCode(membership.tenantId);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de validez

      const redemptionCodeEntity = RedemptionCode.create(
        codeString,
        savedTransaction.id,
        reward.id,
        membership.id,
        membership.tenantId,
        expiresAt,
      );

      existingCode = await this.redemptionCodeRepository.save(redemptionCodeEntity);
      redemptionCode = codeString;
    } else {
      redemptionCode = existingCode.code;
    }

    // 11. Reducir stock de la recompensa
    const updatedReward = reward.reduceStock();
    await this.rewardRepository.update(updatedReward);

    // 12. Sincronizar balance (actualizar proyección en customer_memberships.points)
    await this.balanceSyncService.syncAfterTransaction(membership.id);

    // 13. Obtener balance actualizado
    const updatedMembership = await this.membershipRepository.findById(request.membershipId);
    if (!updatedMembership) {
      throw new NotFoundException(`Membership ${request.membershipId} not found after redemption`);
    }

    return new RedeemRewardResponse({
      transactionId: transaction.id,
      rewardId: reward.id,
      pointsUsed: reward.pointsRequired,
      newBalance: updatedMembership.points,
      redemptionCode,
    });
  }
}
