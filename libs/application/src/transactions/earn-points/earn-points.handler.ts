import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ICustomerMembershipRepository,
  ITransactionRepository,
  IPointsRuleRepository,
  ICustomerTierRepository,
  ITenantRepository,
  Transaction,
} from '@libs/domain';
import { EarnPointsRequest } from './earn-points.request';
import { EarnPointsResponse } from './earn-points.response';
import { TransactionDto } from '../get-transactions/get-transactions.response';
import { TierCalculatorHelper } from '../../customer-memberships/helpers/tier-calculator.helper';

/**
 * Handler para acumular puntos (earn)
 * Calcula puntos usando points rules si se proporciona amount, o usa points directamente
 * Actualiza la customer_membership y recalcula el tier automáticamente
 */
@Injectable()
export class EarnPointsHandler {
  constructor(
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IPointsRuleRepository')
    private readonly pointsRuleRepository: IPointsRuleRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
  ) {}

  async execute(
    request: EarnPointsRequest,
    requestingPartnerId: number,
  ): Promise<EarnPointsResponse> {
    // Buscar membership por QR code
    const membership = await this.membershipRepository.findByQrCode(request.qrCode);

    if (!membership) {
      throw new NotFoundException(`Customer with QR code ${request.qrCode} not found`);
    }

    // Verificar que el customer esté activo
    if (membership.status !== 'active') {
      throw new ForbiddenException(`Customer membership is ${membership.status}`);
    }

    // Verificar que el tenant pertenece al partner del usuario autenticado
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${membership.tenantId} not found`);
    }

    if (tenant.partnerId !== requestingPartnerId) {
      throw new ForbiddenException('Customer does not belong to your partner');
    }

    // Calcular puntos y obtener detalles de cálculo
    let pointsToEarn: number;
    let selectedRuleId: number | null = null;
    let basePoints: number | null = null;
    let pointsMultiplier: number | null = null;
    let bonusPoints: number | null = null;

    if (request.points !== undefined) {
      // Modo manual: usar puntos directamente
      pointsToEarn = request.points;
      basePoints = pointsToEarn;
      // En modo manual, no hay multiplicador ni bonus
      pointsMultiplier = null;
      bonusPoints = 0;
    } else if (request.amount !== undefined || request.transactionAmountTotal !== undefined) {
      // Modo automático: calcular usando points rules
      const amountToUse = request.transactionAmountTotal ?? request.amount ?? 0;
      const calculationResult = await this.calculatePointsFromAmount(
        membership.tenantId,
        amountToUse,
      );
      pointsToEarn = calculationResult.totalPoints;
      selectedRuleId = calculationResult.ruleId;
      basePoints = calculationResult.basePoints;
      pointsMultiplier = calculationResult.multiplier;
      bonusPoints = calculationResult.bonusPoints;
    } else {
      throw new BadRequestException('Either points or amount must be provided');
    }

    if (pointsToEarn <= 0) {
      throw new BadRequestException('Points to earn must be greater than 0');
    }

    // Actualizar membership: agregar puntos y recalcular tier
    const updatedMembership = await TierCalculatorHelper.addPointsAndRecalculateTier(
      membership,
      pointsToEarn,
      this.tierRepository,
    );

    // Si hay amount, registrar la compra y actualizar totalSpent
    let finalMembership = updatedMembership;
    const amountToRecord = request.transactionAmountTotal ?? request.amount;
    if (amountToRecord !== undefined && amountToRecord > 0) {
      finalMembership = updatedMembership.recordPurchase(amountToRecord);
    }

    // Guardar membership actualizada
    const savedMembership = await this.membershipRepository.update(finalMembership);

    // Preparar fecha de transacción
    const transactionDate = request.transactionDate
      ? new Date(request.transactionDate)
      : new Date();

    // Crear transacción con todos los nuevos campos
    const transaction = Transaction.createEarn(
      membership.userId,
      pointsToEarn,
      request.description,
      {
        ...request.metadata,
        amount: amountToRecord,
        qrCode: request.qrCode,
        tenantId: membership.tenantId,
      },
      savedMembership.id,
      request.cashierId ?? null,
      transactionDate,
      request.transactionAmountTotal ?? null,
      request.netAmount ?? null,
      request.taxAmount ?? null,
      request.itemsCount ?? null,
      request.transactionReference ?? null,
      pointsToEarn, // pointsEarned
      selectedRuleId,
      pointsMultiplier,
      basePoints,
      bonusPoints,
    );

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Obtener información del tier para la respuesta
    let tierName: string | null = null;
    if (savedMembership.tierId) {
      const tier = await this.tierRepository.findById(savedMembership.tierId);
      if (tier) {
        tierName = tier.name;
      }
    }

    return new EarnPointsResponse(
      new TransactionDto(
        savedTransaction.id,
        savedTransaction.userId,
        savedTransaction.membershipId,
        savedTransaction.type,
        savedTransaction.points,
        savedTransaction.description,
        savedTransaction.metadata,
        savedTransaction.status,
        savedTransaction.createdAt,
        savedTransaction.updatedAt,
        savedTransaction.cashierId,
        savedTransaction.transactionDate,
        savedTransaction.transactionAmountTotal,
        savedTransaction.netAmount,
        savedTransaction.taxAmount,
        savedTransaction.itemsCount,
        savedTransaction.transactionReference,
        savedTransaction.pointsEarned,
        savedTransaction.pointsRuleId,
        savedTransaction.pointsMultiplier,
        savedTransaction.basePoints,
        savedTransaction.bonusPoints,
      ),
      savedMembership.points,
      savedMembership.tierId,
      tierName,
    );
  }

  /**
   * Calcula puntos basado en el monto usando las points rules activas
   * Retorna información detallada sobre el cálculo incluyendo base_points, multiplier y bonus_points
   */
  private async calculatePointsFromAmount(
    tenantId: number,
    amount: number,
  ): Promise<{
    totalPoints: number;
    ruleId: number | null;
    basePoints: number;
    multiplier: number | null;
    bonusPoints: number;
  }> {
    // Obtener todas las reglas activas de tipo 'purchase'
    const rules = await this.pointsRuleRepository.findByType(tenantId, 'purchase');

    const now = new Date();
    const dayOfWeek = now.getDay();

    // Filtrar solo las activas y que cumplan con el monto mínimo
    const activeRules = rules.filter((rule) => {
      if (!rule.isActive()) {
        return false;
      }

      // Verificar monto mínimo
      if (rule.minAmount !== null && amount < rule.minAmount) {
        return false;
      }

      // Verificar fecha de validez
      if (rule.validFrom && now < rule.validFrom) {
        return false;
      }
      if (rule.validUntil && now > rule.validUntil) {
        return false;
      }

      // Verificar día aplicable
      if (rule.applicableDays !== null && !rule.applicableDays.includes(dayOfWeek)) {
        return false;
      }

      // Verificar horas aplicables
      if (rule.applicableHours) {
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (currentTime < rule.applicableHours.start || currentTime > rule.applicableHours.end) {
          return false;
        }
      }

      return true;
    });

    if (activeRules.length === 0) {
      // Si no hay reglas activas, retornar 0 puntos
      return {
        totalPoints: 0,
        ruleId: null,
        basePoints: 0,
        multiplier: null,
        bonusPoints: 0,
      };
    }

    // Ordenar por prioridad (mayor primero)
    activeRules.sort((a, b) => b.priority - a.priority);

    // Usar la regla con mayor prioridad
    const selectedRule = activeRules[0];

    // Calcular puntos base (sin multiplicador)
    const basePointsValue = Math.floor(selectedRule.pointsPerUnit * amount);

    // Calcular puntos totales usando el método de dominio (incluye multiplicador)
    const totalPointsValue = selectedRule.calculatePoints(amount, dayOfWeek);

    // Calcular puntos bonus (diferencia entre total y base después del multiplicador)
    // Si hay multiplicador, los puntos adicionales son el bonus
    const multiplier = selectedRule.multiplier ?? 1;
    const pointsAfterMultiplier = Math.floor(basePointsValue * multiplier);
    const bonusPointsValue = totalPointsValue - pointsAfterMultiplier;

    return {
      totalPoints: totalPointsValue,
      ruleId: selectedRule.id,
      basePoints: basePointsValue,
      multiplier: selectedRule.multiplier,
      bonusPoints: Math.max(0, bonusPointsValue), // Asegurar que no sea negativo
    };
  }
}
