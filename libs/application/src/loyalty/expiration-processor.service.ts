import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  IPointsTransactionRepository,
  PointsTransaction,
  ICustomerMembershipRepository,
  ILoyaltyProgramRepository,
  ITenantRepository,
  LoyaltyProgram,
  Tenant,
} from '@libs/domain';
import { ExpirationCalculator } from './expiration-calculator.service';
import { BalanceSyncService } from './balance-sync.service';

/**
 * Servicio para procesar expiraciones de puntos
 * Ejecuta batch mensual para crear transacciones EXPIRATION
 */
@Injectable()
export class ExpirationProcessorService {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    private readonly expirationCalculator: ExpirationCalculator,
    private readonly balanceSyncService: BalanceSyncService,
  ) {}

  /**
   * Cron job que se ejecuta mensualmente el día 1 a las 2:00 AM para procesar expiraciones
   */
  @Cron('0 2 1 * *') // Primer día del mes a las 2:00 AM
  async processExpirationsMonthly(): Promise<void> {
    console.log('[ExpirationProcessorService] Iniciando procesamiento mensual de expiraciones...');

    try {
      // Obtener todas las transacciones EARNING que están próximas a expirar o ya expiraron
      // Procesar por tenant para aplicar políticas específicas
      const tenants = await this.tenantRepository.findAllActive();

      for (const tenant of tenants) {
        try {
          await this.processExpirationsForTenant(tenant.id);
        } catch (error) {
          console.error(`Error processing expirations for tenant ${tenant.id}:`, error);
        }
      }

      console.log('[ExpirationProcessorService] Procesamiento mensual de expiraciones completado');
    } catch (error) {
      console.error(
        '[ExpirationProcessorService] Error en procesamiento mensual de expiraciones:',
        error,
      );
    }
  }

  /**
   * Procesa expiraciones para un tenant específico
   */
  async processExpirationsForTenant(tenantId: number): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      return;
    }

    // Obtener todos los memberships activos del tenant
    const memberships = await this.membershipRepository.findByTenantId(tenantId);
    const activeMemberships = memberships.filter((m) => m.status === 'active');

    for (const membership of activeMemberships) {
      try {
        await this.processExpirationsForMembership(membership.id, tenant);
      } catch (error) {
        console.warn(`Error processing expirations for membership ${membership.id}:`, error);
      }
    }
  }

  /**
   * Procesa expiraciones para una membership específica
   */
  async processExpirationsForMembership(membershipId: number, tenant: Tenant): Promise<void> {
    // Obtener transacciones EARNING que están próximas a expirar o ya expiraron
    // Buscar transacciones con expiresAt <= hoy
    const now = new Date();
    const transactions = await this.pointsTransactionRepository.findForTierEvaluation(
      membershipId,
      new Date(0), // Desde siempre
      now,
    );

    // Filtrar solo transacciones EARNING con expiresAt válido y que ya expiraron
    const expiredEarnings = transactions.filter(
      (tx) =>
        tx.type === 'EARNING' &&
        tx.expiresAt !== null &&
        this.expirationCalculator.isExpired(tx.expiresAt, now),
    );

    if (expiredEarnings.length === 0) {
      return; // No hay transacciones expiradas
    }

    // Agrupar por programa para aplicar políticas específicas
    const transactionsByProgram = new Map<number, PointsTransaction[]>();
    for (const tx of expiredEarnings) {
      if (tx.programId) {
        if (!transactionsByProgram.has(tx.programId)) {
          transactionsByProgram.set(tx.programId, []);
        }
        transactionsByProgram.get(tx.programId)!.push(tx);
      }
    }

    // Procesar cada programa
    for (const [programId, programTransactions] of transactionsByProgram.entries()) {
      const program = await this.programRepository.findById(programId);
      if (!program) {
        continue;
      }

      const policyType = this.expirationCalculator.getExpirationPolicyType(program);

      if (policyType === 'bucketed') {
        // Implementar lógica FIFO para bucketed
        await this.processBucketedExpirations(membershipId, programTransactions, program, tenant);
      } else {
        // Implementar lógica simple
        await this.processSimpleExpirations(membershipId, programTransactions, program, tenant);
      }
    }
  }

  /**
   * Procesa expiraciones con política simple (todo junto)
   */
  private async processSimpleExpirations(
    membershipId: number,
    expiredTransactions: PointsTransaction[],
    program: LoyaltyProgram,
    tenant: Tenant,
  ): Promise<void> {
    // Calcular total de puntos expirados
    const totalExpiredPoints = expiredTransactions.reduce((sum, tx) => sum + tx.pointsDelta, 0);

    if (totalExpiredPoints <= 0) {
      return; // No hay puntos para expirar
    }

    // Verificar si ya existe una transacción EXPIRATION para este período
    // Usar idempotency key basado en membership, programa y mes
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const idempotencyKey = `EXPIRATION-${membershipId}-${program.id}-${monthKey}`;

    const existingExpiration =
      await this.pointsTransactionRepository.findByIdempotencyKey(idempotencyKey);

    if (existingExpiration) {
      return; // Ya se procesó la expiración para este mes
    }

    // Crear transacción EXPIRATION
    const expirationTransaction = PointsTransaction.createExpiration(
      tenant.id,
      expiredTransactions[0].customerId, // Usar customerId de la primera transacción
      membershipId,
      -totalExpiredPoints, // Negativo para reducir puntos
      idempotencyKey,
      null, // correlationId
      'SYSTEM',
      'POINTS_EXPIRATION',
      {
        expiredTransactions: expiredTransactions.map((tx) => tx.id),
        expirationPolicy: 'simple',
        expirationDate: now.toISOString(),
      },
    );

    await this.pointsTransactionRepository.save(expirationTransaction);

    // Sincronizar balance
    await this.balanceSyncService.syncAfterTransaction(membershipId);
  }

  /**
   * Procesa expiraciones con política bucketed (FIFO)
   * Consume puntos más antiguos primero
   */
  private async processBucketedExpirations(
    membershipId: number,
    expiredTransactions: PointsTransaction[],
    program: LoyaltyProgram,
    tenant: Tenant,
  ): Promise<void> {
    // Ordenar transacciones por fecha de creación (más antiguas primero) para FIFO
    const sortedTransactions = expiredTransactions.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    // Procesar cada transacción expirada individualmente (FIFO)
    for (const tx of sortedTransactions) {
      // Verificar si ya existe una transacción EXPIRATION para esta transacción específica
      const idempotencyKey = `EXPIRATION-${membershipId}-${tx.id}`;

      const existingExpiration =
        await this.pointsTransactionRepository.findByIdempotencyKey(idempotencyKey);

      if (existingExpiration) {
        continue; // Ya se procesó la expiración para esta transacción
      }

      // Crear transacción EXPIRATION para esta transacción específica
      const expirationTransaction = PointsTransaction.createExpiration(
        tenant.id,
        tx.customerId,
        membershipId,
        -tx.pointsDelta, // Negativo para reducir puntos
        idempotencyKey,
        tx.id.toString(), // correlationId para relacionar con la transacción original
        'SYSTEM',
        'POINTS_EXPIRATION_BUCKETED',
        {
          expiredTransactionId: tx.id,
          expirationPolicy: 'bucketed',
          expirationDate: tx.expiresAt?.toISOString() || new Date().toISOString(),
        },
      );

      await this.pointsTransactionRepository.save(expirationTransaction);
    }

    // Sincronizar balance después de procesar todas las expiraciones
    await this.balanceSyncService.syncAfterTransaction(membershipId);
  }
}
