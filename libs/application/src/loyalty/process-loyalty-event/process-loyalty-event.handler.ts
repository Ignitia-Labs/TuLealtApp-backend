import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  LoyaltyEvent,
  ProcessLoyaltyEventResult,
  ICustomerMembershipRepository,
  ICustomerTierRepository,
  IPointsTransactionRepository,
  PointsTransaction,
  CustomerMembership,
  CustomerTier,
} from '@libs/domain';
import { EventNormalizer } from '../event-normalizer.service';
import { MembershipResolver } from '../membership-resolver.service';
import { ProgramCompatibilityResolver } from '../program-compatibility-resolver.service';
import { RewardRuleEvaluator } from '../reward-rule-evaluator.service';
import { ConflictResolver } from '../conflict-resolver.service';
import { IdempotencyKeyGenerator } from '../idempotency-key-generator.service';
import { BalanceSyncService } from '../balance-sync.service';
import { TierChangeService } from '../tier-change.service';
import { ReferralService } from '../referral.service';
import { ExpirationCalculator } from '../expiration-calculator.service';
import { IRewardRuleRepository, ITenantRepository, ILoyaltyProgramRepository } from '@libs/domain';

/**
 * Handler principal para procesar eventos de lealtad
 * Orquesta todo el flujo de evaluación y otorgamiento de puntos
 */
@Injectable()
export class ProcessLoyaltyEventHandler {
  private readonly logger = new Logger(ProcessLoyaltyEventHandler.name);

  constructor(
    private readonly eventNormalizer: EventNormalizer,
    private readonly membershipResolver: MembershipResolver,
    private readonly programCompatibilityResolver: ProgramCompatibilityResolver,
    private readonly ruleEvaluator: RewardRuleEvaluator,
    private readonly conflictResolver: ConflictResolver,
    private readonly idempotencyKeyGenerator: IdempotencyKeyGenerator,
    private readonly balanceSyncService: BalanceSyncService,
    private readonly tierChangeService: TierChangeService,
    private readonly referralService: ReferralService,
    private readonly expirationCalculator: ExpirationCalculator,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
    @Inject('ITenantRepository')
    private readonly tenantRepository: ITenantRepository,
    @Inject('ILoyaltyProgramRepository')
    private readonly programRepository: ILoyaltyProgramRepository,
    @Inject('ICustomerTierRepository')
    private readonly tierRepository: ICustomerTierRepository,
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('IRewardRuleRepository')
    private readonly ruleRepository: IRewardRuleRepository,
  ) {}

  /**
   * Procesa un evento de lealtad completo
   * Implementa el flujo descrito en PLAN-TIPOS-RECOMPENSA.md sección 7
   */
  async execute(event: Partial<LoyaltyEvent>): Promise<ProcessLoyaltyEventResult> {
    const startTime = Date.now();
    this.logger.log({
      message: 'Processing loyalty event',
      eventType: event.eventType,
      sourceEventId: event.sourceEventId,
      tenantId: event.tenantId,
      membershipRef: event.membershipRef,
    });

    try {
      // 1. Normalizar evento
      const normalizedEvent = this.eventNormalizer.normalize(event);

      // 2. Resolver membership
      const membership = await this.membershipResolver.resolveActive(normalizedEvent.membershipRef);

      // 3. Cargar enrollments activos y aplicar compatibilidad → lista final de programas
      const compatiblePrograms = await this.programCompatibilityResolver.resolveCompatiblePrograms(
        membership.id,
        normalizedEvent.tenantId,
      );

      if (compatiblePrograms.length === 0) {
        return {
          eventId: normalizedEvent.sourceEventId,
          membershipId: membership.id,
          programsProcessed: [],
          transactionsCreated: [],
          totalPointsAwarded: 0,
          evaluations: [],
          skipped: [
            {
              reason: 'No compatible programs found for membership',
            },
          ],
        };
      }

      // 4. Obtener tier actual
      const tier = membership.tierId ? await this.tierRepository.findById(membership.tierId) : null;

      // 5. Evaluar reglas por programa
      const allEvaluations: any[] = [];
      const skipped: Array<{ reason: string; ruleId?: number; programId?: number }> = [];

      for (const program of compatiblePrograms) {
        // Obtener reglas activas del programa
        const rules = await this.ruleRepository.findActiveByProgramIdAndTrigger(
          program.id,
          normalizedEvent.eventType,
        );

        if (rules.length === 0) {
          skipped.push({
            reason: `No active rules found for trigger ${normalizedEvent.eventType}`,
            programId: program.id,
          });
          continue;
        }

        // Evaluar reglas
        const evaluations = await this.ruleEvaluator.evaluateRules(
          program.id,
          normalizedEvent,
          membership,
          tier,
        );

        if (evaluations.length === 0) {
          skipped.push({
            reason: 'No eligible rules matched',
            programId: program.id,
          });
          continue;
        }

        // Generar idempotency keys para cada evaluación
        for (const evaluation of evaluations) {
          const rule = rules.find((r) => r.id === evaluation.ruleId);
          if (rule) {
            evaluation.idempotencyKey = this.idempotencyKeyGenerator.generateKey(
              rule,
              normalizedEvent,
              membership.id,
            );
          }
        }

        allEvaluations.push(...evaluations);
      }

      // 6. Resolver colisiones
      const resolvedEvaluations = await this.conflictResolver.resolveConflicts(
        allEvaluations,
        normalizedEvent.occurredAt,
        membership.id,
      );

      // 7. Calcular puntos + caps (ya aplicados en conflictResolver)
      const totalPointsAwarded = resolvedEvaluations.reduce((sum, eval_) => sum + eval_.points, 0);

      // 8. Insertar ledger idempotente
      const transactionsCreated: number[] = [];

      for (const evaluation of resolvedEvaluations) {
        try {
          // Verificar idempotencia
          const existingTransaction = await this.pointsTransactionRepository.findByIdempotencyKey(
            evaluation.idempotencyKey,
          );

          if (existingTransaction) {
            // Ya existe, no duplicar
            transactionsCreated.push(existingTransaction.id);
            continue;
          }

          // Crear nueva transacción
          const rule = await this.ruleRepository.findById(evaluation.ruleId);
          if (!rule) {
            skipped.push({
              reason: `Rule ${evaluation.ruleId} not found`,
              ruleId: evaluation.ruleId,
            });
            continue;
          }

          // Calcular fecha de expiración según política del programa
          const program = await this.programRepository.findById(rule.programId);
          const tenant = await this.tenantRepository.findById(normalizedEvent.tenantId);
          if (!tenant) {
            skipped.push({
              reason: `Tenant ${normalizedEvent.tenantId} not found`,
              ruleId: evaluation.ruleId,
            });
            continue;
          }

          const expiresAt = this.expirationCalculator.calculateExpirationDate(
            program,
            tenant,
            normalizedEvent.occurredAt,
          );

          const transaction = PointsTransaction.createEarning(
            normalizedEvent.tenantId,
            membership.userId,
            membership.id,
            evaluation.points,
            evaluation.idempotencyKey,
            normalizedEvent.sourceEventId,
            normalizedEvent.correlationId || null,
            'SYSTEM',
            evaluation.reasonCode || null,
            rule.programId,
            evaluation.ruleId,
            evaluation.metadata || null,
            expiresAt,
          );

          const savedTransaction = await this.pointsTransactionRepository.save(transaction);
          transactionsCreated.push(savedTransaction.id);
        } catch (error: any) {
          // Si es error de idempotencia (duplicado), ignorar
          if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('idempotency')) {
            // Ya existe, continuar
            continue;
          }
          // Otro error, agregar a skipped
          skipped.push({
            reason: `Error creating transaction: ${error.message}`,
            ruleId: evaluation.ruleId,
          });
        }
      }

      // 9. Actualizar totalVisits y lastVisit para eventos VISIT
      if (normalizedEvent.eventType === 'VISIT' && transactionsCreated.length > 0) {
        // Solo actualizar si se crearon transacciones exitosas
        // Usar recordVisit() que incrementa totalVisits y actualiza lastVisit
        const updatedMembership = membership.recordVisit();
        await this.membershipRepository.save(updatedMembership);
      }

      // 9.5. Actualizar totalSpent para eventos PURCHASE
      if (
        normalizedEvent.eventType === 'PURCHASE' &&
        transactionsCreated.length > 0 &&
        'orderId' in normalizedEvent.payload
      ) {
        // Solo actualizar si se crearon transacciones exitosas
        const payload = normalizedEvent.payload as any;
        const purchaseAmount = payload.netAmount || payload.grossAmount || 0;
        if (purchaseAmount > 0) {
          // 9.6. Verificar si es primera compra ANTES de actualizar totalSpent
          // Si totalSpent es 0, esta es probablemente la primera compra
          const isFirstPurchase = membership.totalSpent === 0;

          // Usar recordPurchase() que incrementa totalSpent
          const updatedMembership = membership.recordPurchase(purchaseAmount);
          await this.membershipRepository.save(updatedMembership);

          // 9.7. Procesar referidos si es primera compra
          if (isFirstPurchase) {
            // Procesar referidos: marcar referrals como completados
            const completedReferrals = await this.referralService.processFirstPurchase(
              membership.id,
              normalizedEvent.tenantId,
            );

            // Para cada referral completado, disparar evento REFERRAL para otorgar puntos al referidor
            // Nota: Esto se puede hacer de forma asíncrona en el futuro, pero por ahora lo hacemos síncrono
            for (const referral of completedReferrals) {
              try {
                // Crear evento REFERRAL para el referidor
                const referralEvent: Partial<LoyaltyEvent> = {
                  tenantId: normalizedEvent.tenantId,
                  eventType: 'REFERRAL',
                  sourceEventId: `REFERRAL-${referral.id}-${normalizedEvent.sourceEventId}`,
                  occurredAt: normalizedEvent.occurredAt,
                  membershipRef: {
                    membershipId: referral.referrerMembershipId,
                  },
                  payload: {
                    referredMembershipId: referral.referredMembershipId,
                    referralCode: referral.referralCode,
                    firstPurchaseCompleted: true,
                  },
                  correlationId: normalizedEvent.sourceEventId,
                  createdBy: normalizedEvent.createdBy || 'SYSTEM',
                  metadata: {
                    referralId: referral.id,
                    originalPurchaseEventId: normalizedEvent.sourceEventId,
                  },
                };

                // Procesar evento REFERRAL (recursivo, pero seguro porque es un evento diferente)
                await this.execute(referralEvent);
              } catch (error) {
                // Log error pero no fallar el procesamiento del evento original
                console.warn(`Error processing referral event for referral ${referral.id}:`, error);
              }
            }
          }
        }
      }

      // 10. Actualizar proyecciones
      if (transactionsCreated.length > 0) {
        // Sincronizar balance después de crear transacciones
        await this.balanceSyncService.syncAfterTransaction(membership.id);
      }

      // 11. Evaluar y aplicar cambios de tier (opcional, puede ser asíncrono)
      // Solo evaluar si se crearon transacciones que afectan puntos
      if (transactionsCreated.length > 0 && totalPointsAwarded > 0) {
        try {
          // Usar membership actualizada si se actualizó totalVisits
          const membershipForTierEvaluation =
            normalizedEvent.eventType === 'VISIT' && transactionsCreated.length > 0
              ? await this.membershipRepository.findById(membership.id)
              : membership;

          if (membershipForTierEvaluation) {
            await this.tierChangeService.evaluateAndApplyTierChange(
              membershipForTierEvaluation.id,
              normalizedEvent.tenantId,
            );
          }
        } catch (error) {
          // Log error pero no fallar el procesamiento del evento
          this.logger.warn({
            message: 'Error evaluating tier change',
            membershipId: membership.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // 12. Retornar respuesta
      const duration = Date.now() - startTime;
      this.logger.log({
        message: 'Loyalty event processed successfully',
        eventType: normalizedEvent.eventType,
        sourceEventId: normalizedEvent.sourceEventId,
        membershipId: membership.id,
        programsProcessed: compatiblePrograms.length,
        transactionsCreated: transactionsCreated.length,
        totalPointsAwarded,
        durationMs: duration,
        skipped: skipped.length,
      });

      return {
        eventId: normalizedEvent.sourceEventId,
        membershipId: membership.id,
        programsProcessed: compatiblePrograms.map((p) => p.id),
        transactionsCreated,
        totalPointsAwarded,
        evaluations: resolvedEvaluations,
        skipped,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error({
        message: 'Error processing loyalty event',
        eventType: event.eventType,
        sourceEventId: event.sourceEventId,
        tenantId: event.tenantId,
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
