import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  IPointsTransactionRepository,
  PointsTransaction,
  ICustomerMembershipRepository,
  CustomerMembership,
} from '@libs/domain';
import { BalanceSyncService } from './balance-sync.service';
import { TierChangeService } from './tier-change.service';

/**
 * Servicio para procesar reversiones de transacciones
 * Las reversiones crean una transacción opuesta vinculada a la original
 */
@Injectable()
export class ReversalService {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    private readonly balanceSyncService: BalanceSyncService,
    private readonly tierChangeService: TierChangeService,
  ) {}

  /**
   * Crea una reversión de una transacción existente
   * @param originalTransactionId ID de la transacción original a revertir
   * @param reasonCode Código de razón para la reversión (ej: 'REFUND', 'CHARGEBACK')
   * @param createdBy Usuario/sistema que crea la reversión
   * @param metadata Metadatos adicionales
   * @returns Transacción de reversión creada
   */
  async createReversal(
    originalTransactionId: number,
    reasonCode: string,
    createdBy: string,
    metadata?: Record<string, any>,
  ): Promise<PointsTransaction> {
    // 1. Obtener transacción original
    const originalTransaction =
      await this.pointsTransactionRepository.findById(originalTransactionId);
    if (!originalTransaction) {
      throw new NotFoundException(`Transaction ${originalTransactionId} not found`);
    }

    // 2. Validar que la transacción original puede ser revertida
    this.validateReversible(originalTransaction);

    // 3. Verificar si ya existe una reversión para esta transacción
    const existingReversals =
      await this.pointsTransactionRepository.findReversalsOf(originalTransactionId);
    if (existingReversals.length > 0) {
      throw new BadRequestException(
        `Transaction ${originalTransactionId} has already been reversed. Reversal ID: ${existingReversals[0].id}`,
      );
    }

    // 4. Obtener membership para validar
    const membership = await this.membershipRepository.findById(originalTransaction.membershipId);
    if (!membership) {
      throw new NotFoundException(`Membership ${originalTransaction.membershipId} not found`);
    }

    // 5. Generar idempotency key único
    const idempotencyKey = `REVERSAL-${originalTransactionId}-${Date.now()}`;

    // 6. Crear transacción de reversión
    // La reversión tiene pointsDelta negativo del original (opuesto)
    const reversalPointsDelta = -originalTransaction.pointsDelta;

    // Crear transacción REVERSAL directamente con el constructor para establecer pointsDelta correcto
    // Nota: PointsTransaction.createReversal() crea con pointsDelta=0, pero necesitamos el opuesto
    const reversalTransaction = new PointsTransaction(
      0,
      originalTransaction.tenantId,
      originalTransaction.customerId,
      originalTransaction.membershipId,
      originalTransaction.programId,
      originalTransaction.rewardRuleId,
      'REVERSAL',
      reversalPointsDelta, // Negativo del original para revertir el efecto
      idempotencyKey,
      originalTransaction.sourceEventId,
      originalTransaction.correlationId || null,
      createdBy,
      reasonCode,
      {
        ...metadata,
        originalPointsDelta: originalTransaction.pointsDelta,
        reversedPointsDelta: reversalPointsDelta,
        originalTransactionType: originalTransaction.type,
        originalCreatedAt: originalTransaction.createdAt.toISOString(),
      },
      originalTransactionId, // reversalOfTransactionId
      null, // expiresAt (las reversiones no expiran)
      new Date(),
    );

    // 7. Guardar transacción de reversión
    const savedReversal = await this.pointsTransactionRepository.save(reversalTransaction);

    // 8. Sincronizar balance
    await this.balanceSyncService.syncAfterTransaction(originalTransaction.membershipId);

    // 9. Recalcular tier si la transacción original afectaba el tier
    if (originalTransaction.type === 'EARNING' && originalTransaction.pointsDelta > 0) {
      const updatedMembership = await this.membershipRepository.findById(
        originalTransaction.membershipId,
      );
      if (updatedMembership) {
        await this.tierChangeService.evaluateAndApplyTierChange(
          updatedMembership.id,
          updatedMembership.tenantId,
        );
      }
    }

    return savedReversal;
  }

  /**
   * Valida que una transacción puede ser revertida
   */
  private validateReversible(transaction: PointsTransaction): void {
    // No se puede revertir una reversión
    if (transaction.type === 'REVERSAL') {
      throw new BadRequestException('Cannot reverse a REVERSAL transaction');
    }

    // No se puede revertir una expiración (ya fueron puntos perdidos)
    if (transaction.type === 'EXPIRATION') {
      throw new BadRequestException('Cannot reverse an EXPIRATION transaction');
    }

    // No se puede revertir un ajuste (debe usar otro ajuste)
    if (transaction.type === 'ADJUSTMENT') {
      throw new BadRequestException(
        'Cannot reverse an ADJUSTMENT transaction. Use another ADJUSTMENT to correct it.',
      );
    }

    // Solo se pueden revertir EARNING o REDEEM
    if (transaction.type !== 'EARNING' && transaction.type !== 'REDEEM') {
      throw new BadRequestException(
        `Cannot reverse transaction of type ${transaction.type}. Only EARNING and REDEEM can be reversed.`,
      );
    }
  }

  /**
   * Obtiene la cadena completa de reversiones para una transacción
   * Útil para auditoría y trazabilidad
   */
  async getReversalChain(transactionId: number): Promise<{
    original: PointsTransaction;
    reversals: PointsTransaction[];
  }> {
    const original = await this.pointsTransactionRepository.findById(transactionId);
    if (!original) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    const reversals = await this.pointsTransactionRepository.findReversalsOf(transactionId);

    return {
      original,
      reversals,
    };
  }

  /**
   * Verifica si una transacción ha sido revertida
   */
  async isReversed(transactionId: number): Promise<boolean> {
    const reversals = await this.pointsTransactionRepository.findReversalsOf(transactionId);
    return reversals.length > 0;
  }
}
