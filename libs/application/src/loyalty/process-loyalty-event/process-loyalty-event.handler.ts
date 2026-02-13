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

      // 5. OPTIMIZACIÓN: Cargar TODAS las reglas de TODOS los programas en batch
      // Esto evita N queries (una por programa) en el loop siguiente
      const allProgramIds = compatiblePrograms.map(p => p.id);
      const allRules = await this.ruleRepository.findActiveByProgramIdsAndTrigger(
        allProgramIds,
        normalizedEvent.eventType,
      );

      // Agrupar reglas por programId para acceso rápido en O(1)
      const rulesByProgram = new Map<number, typeof allRules>();
      allRules.forEach(rule => {
        if (!rulesByProgram.has(rule.programId)) {
          rulesByProgram.set(rule.programId, []);
        }
        rulesByProgram.get(rule.programId)!.push(rule);
      });

      // 6. Evaluar reglas por programa
      const allEvaluations: any[] = [];
      const skipped: Array<{ reason: string; ruleId?: number; programId?: number }> = [];

      for (const program of compatiblePrograms) {
        this.logger.debug(
          `Processing program ${program.id} (${program.name}) - type: ${program.programType}`,
        );

        // OPTIMIZACIÓN: Obtener reglas desde el Map en lugar de query
        const rules = rulesByProgram.get(program.id) || [];

        this.logger.debug(
          `Found ${rules.length} active rules for program ${program.id} with trigger ${normalizedEvent.eventType}`,
        );

        if (rules.length === 0) {
          this.logger.debug(
            `No active rules found for trigger ${normalizedEvent.eventType} in program ${program.id}`,
          );
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

        this.logger.debug(
          `Rule evaluation returned ${evaluations.length} evaluations for program ${program.id}`,
        );

        if (evaluations.length === 0) {
          this.logger.debug(`No eligible rules matched for program ${program.id}`);
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

      // 8. OPTIMIZACIÓN: Cargar datos necesarios en batch ANTES del loop
      // Esto evita 4N queries (N evaluaciones × 4 queries cada una)
      
      // 8.1. Verificar idempotencia en batch
      const idempotencyKeys = resolvedEvaluations.map(e => e.idempotencyKey);
      const existingTransactionsMap = await this.pointsTransactionRepository.findByIdempotencyKeys(
        idempotencyKeys,
      );

      // 8.2. Cargar todas las reglas necesarias en batch
      const ruleIds = [...new Set(resolvedEvaluations.map(e => e.ruleId))];
      const rulesMap = new Map<number, any>();
      if (ruleIds.length > 0) {
        const rules = await this.ruleRepository.findByIds(ruleIds);
        rules.forEach(r => rulesMap.set(r.id, r));
      }

      // 8.3. Cargar todos los programas necesarios en batch
      const programIds = [...new Set(Array.from(rulesMap.values()).map(r => r.programId))];
      const programsMap = new Map<number, any>();
      if (programIds.length > 0) {
        const programs = await this.programRepository.findByIds(programIds);
        programs.forEach(p => programsMap.set(p.id, p));
      }

      // 8.4. Cargar tenant una sola vez (no cambia entre evaluaciones)
      const tenant = await this.tenantRepository.findById(normalizedEvent.tenantId);
      if (!tenant) {
        this.logger.warn({
          message: 'Tenant not found, skipping all evaluations',
          tenantId: normalizedEvent.tenantId,
        });
        return {
          eventId: normalizedEvent.sourceEventId,
          membershipId: membership.id,
          programsProcessed: compatiblePrograms.map((p) => p.id),
          transactionsCreated: [],
          totalPointsAwarded: 0,
          evaluations: resolvedEvaluations,
          skipped: [{ reason: `Tenant ${normalizedEvent.tenantId} not found` }],
        };
      }

      // 9. Insertar ledger idempotente (ahora con datos precargados)
      const transactionsCreated: number[] = [];

      for (const evaluation of resolvedEvaluations) {
        try {
          // OPTIMIZACIÓN: Verificar idempotencia desde Map precargado
          const existingTransaction = existingTransactionsMap.get(evaluation.idempotencyKey);

          if (existingTransaction) {
            // Ya existe, no duplicar
            transactionsCreated.push(existingTransaction.id);
            continue;
          }

          // OPTIMIZACIÓN: Obtener rule desde Map precargado
          const rule = rulesMap.get(evaluation.ruleId);
          if (!rule) {
            skipped.push({
              reason: `Rule ${evaluation.ruleId} not found`,
              ruleId: evaluation.ruleId,
            });
            continue;
          }

          // OPTIMIZACIÓN: Obtener program desde Map precargado
          const program = programsMap.get(rule.programId);
          if (!program) {
            skipped.push({
              reason: `Program ${rule.programId} not found`,
              ruleId: evaluation.ruleId,
            });
            continue;
          }

          // Calcular fecha de expiración según política del programa (tenant ya cargado arriba)
          const expiresAt = this.expirationCalculator.calculateExpirationDate(
            program,
            tenant,
            normalizedEvent.occurredAt,
          );

          // Extraer amount y currency para eventos PURCHASE
          let amount: number | null = null;
          let currency: string | null = null;

          if (normalizedEvent.eventType === 'PURCHASE' && 'orderId' in normalizedEvent.payload) {
            const purchasePayload = normalizedEvent.payload as any;
            // Preferir netAmount sobre grossAmount (según especificación)
            amount = purchasePayload.netAmount || purchasePayload.grossAmount || null;
            currency = purchasePayload.currency || 'GTQ'; // Default a GTQ si no se especifica
          }

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
            normalizedEvent.branchId || null, // branchId from event payload
            amount, // ← NUEVO: monto de la transacción
            currency, // ← NUEVO: moneda de la transacción
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
                this.logger.warn(
                  `Error processing referral event for referral ${referral.id}`,
                  error instanceof Error ? error.stack : String(error),
                );
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
