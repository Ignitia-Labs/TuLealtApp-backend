import { Injectable, Inject } from '@nestjs/common';
import { BalanceProjectionService } from './balance-projection.service';
import { IPointsTransactionRepository } from '@libs/domain';

/**
 * Servicio para sincronizar balances después de transacciones
 * Puede ejecutarse de forma síncrona o asíncrona según configuración
 */
@Injectable()
export class BalanceSyncService {
  constructor(
    private readonly balanceProjectionService: BalanceProjectionService,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
  ) {}

  /**
   * Sincroniza el balance de una membership después de una transacción
   * @param membershipId ID de la membership
   * @param syncMode 'sync' para actualización inmediata, 'async' para encolar
   */
  async syncBalanceAfterTransaction(
    membershipId: number,
    syncMode: 'sync' | 'async' = 'sync',
  ): Promise<void> {
    if (syncMode === 'sync') {
      // Actualización síncrona inmediata
      await this.balanceProjectionService.recalculateBalance(membershipId);
    } else {
      // Actualización asíncrona (encolar para procesar después)
      // Por ahora, también hacemos sync. En el futuro se puede usar una cola
      // TODO: Implementar cola de mensajes para actualizaciones asíncronas
      await this.balanceProjectionService.recalculateBalance(membershipId);
    }
  }

  /**
   * Sincroniza balances de múltiples memberships en batch
   * Útil para reparación o sincronización masiva
   * @param membershipIds Array de IDs de memberships
   * @param batchSize Tamaño del batch para procesar (default: 100)
   */
  async syncBalancesBatch(
    membershipIds: number[],
    batchSize: number = 100,
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    // Procesar en batches para evitar sobrecarga
    for (let i = 0; i < membershipIds.length; i += batchSize) {
      const batch = membershipIds.slice(i, i + batchSize);

      const results = await this.balanceProjectionService.recalculateBalancesBatch(batch);

      synced += results.length;
      errors += batch.length - results.length;
    }

    return { synced, errors };
  }

  /**
   * Encuentra memberships con balances inconsistentes y los sincroniza
   * Útil para job de reparación periódica
   * @param tenantId ID del tenant (opcional, si se proporciona solo sincroniza ese tenant)
   * @returns Número de memberships sincronizadas
   */
  async repairInconsistentBalances(tenantId?: number): Promise<number> {
    // Obtener todas las memberships (o del tenant específico)
    // Por ahora, esto es un placeholder. En producción se implementaría con una query optimizada
    // que encuentre memberships donde points != SUM(pointsDelta) del ledger

    // TODO: Implementar query optimizada para encontrar inconsistencias
    // Por ahora, retornamos 0
    return 0;
  }

  /**
   * Sincroniza balance después de crear una transacción
   * Método de conveniencia que se puede llamar desde handlers
   * @param membershipId ID de la membership
   */
  async syncAfterTransaction(membershipId: number): Promise<void> {
    await this.syncBalanceAfterTransaction(membershipId, 'sync');
  }
}
