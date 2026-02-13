import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  IPointsTransactionRepository,
  PointsTransaction,
  ICustomerMembershipRepository,
  CustomerMembership,
} from '@libs/domain';
import { BalanceSyncService } from './balance-sync.service';
import { TierChangeService } from './tier-change.service';

/**
 * Servicio para crear ajustes manuales de puntos
 * Solo usuarios ADMIN pueden crear ajustes
 */
@Injectable()
export class AdjustmentService {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    private readonly balanceSyncService: BalanceSyncService,
    private readonly tierChangeService: TierChangeService,
  ) {}

  /**
   * Crea un ajuste manual de puntos
   * @param membershipId ID de la membership
   * @param pointsDelta Cantidad de puntos a ajustar (positivo para agregar, negativo para quitar)
   * @param reasonCode Código de razón obligatorio (ej: 'CORRECTION', 'BONUS', 'PENALTY')
   * @param createdBy Usuario ADMIN que crea el ajuste
   * @param branchId ID de la sucursal donde se realiza el ajuste (opcional)
   * @param metadata Metadatos adicionales
   * @returns Transacción de ajuste creada
   */
  async createAdjustment(
    membershipId: number,
    pointsDelta: number,
    reasonCode: string,
    createdBy: string,
    branchId?: number | null,
    metadata?: Record<string, any>,
  ): Promise<PointsTransaction> {
    // 1. Validar que createdBy es ADMIN
    // Nota: En producción, esto debería validar roles desde el contexto de autenticación
    // Por ahora, validamos que createdBy no sea 'SYSTEM'
    if (!createdBy || createdBy === 'SYSTEM') {
      throw new ForbiddenException('Only ADMIN users can create adjustments');
    }

    // 2. Validar reasonCode obligatorio
    if (!reasonCode || reasonCode.trim() === '') {
      throw new BadRequestException('reasonCode is required for adjustments');
    }

    // 3. Validar pointsDelta no cero
    if (pointsDelta === 0) {
      throw new BadRequestException('pointsDelta must be non-zero for adjustments');
    }

    // 4. Obtener membership
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership ${membershipId} not found`);
    }

    // 5. Validar que el ajuste no resulte en balance negativo (si es negativo)
    if (pointsDelta < 0) {
      const currentBalance = await this.pointsTransactionRepository.calculateBalance(membershipId);
      if (currentBalance + pointsDelta < 0) {
        throw new BadRequestException(
          `Adjustment would result in negative balance. Current balance: ${currentBalance}, Adjustment: ${pointsDelta}`,
        );
      }
    }

    // 6. Generar idempotency key único
    const idempotencyKey = `ADJUSTMENT-${membershipId}-${reasonCode}-${Date.now()}`;

    // 7. Crear transacción de ajuste
    const adjustmentTransaction = PointsTransaction.createAdjustment(
      membership.tenantId,
      membership.userId,
      membershipId,
      pointsDelta,
      idempotencyKey,
      createdBy,
      reasonCode,
      null, // correlationId
      {
        ...metadata,
        adjustmentType: pointsDelta > 0 ? 'ADD' : 'SUBTRACT',
        previousBalance: await this.pointsTransactionRepository.calculateBalance(membershipId),
      },
      branchId || null,
    );

    // 8. Guardar transacción
    const savedAdjustment = await this.pointsTransactionRepository.save(adjustmentTransaction);

    // 9. Sincronizar balance
    await this.balanceSyncService.syncAfterTransaction(membershipId);

    // 10. Recalcular tier si el ajuste afecta puntos positivos (opcional)
    // Solo evaluar si hay una política de tier configurada
    if (pointsDelta > 0) {
      try {
        const updatedMembership = await this.membershipRepository.findById(membershipId);
        if (updatedMembership) {
          await this.tierChangeService.evaluateAndApplyTierChange(
            updatedMembership.id,
            updatedMembership.tenantId,
          );
        }
      } catch (error) {
        // Si no hay política de tier configurada, continuar sin error
        // El ajuste de puntos se completó exitosamente
        if (error instanceof Error && error.message.includes('No active tier policy')) {
          console.log(
            `[AdjustmentService] Tier evaluation skipped: No tier policy configured for tenant`,
          );
        } else {
          // Otro tipo de error, log pero no fallar el ajuste
          console.warn(`[AdjustmentService] Error evaluating tier change after adjustment:`, error);
        }
      }
    }

    return savedAdjustment;
  }

  /**
   * Obtiene historial de ajustes para una membership
   * Útil para auditoría
   */
  async getAdjustmentHistory(
    membershipId: number,
    limit: number = 100,
  ): Promise<PointsTransaction[]> {
    const allTransactions = await this.pointsTransactionRepository.findByMembershipId(membershipId);
    const adjustments = allTransactions
      .filter((tx) => tx.type === 'ADJUSTMENT')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return adjustments;
  }
}
