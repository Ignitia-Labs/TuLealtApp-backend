import { Injectable, Inject } from '@nestjs/common';
import {
  IPointsTransactionRepository,
  ICustomerMembershipRepository,
  CustomerMembership,
  PointsTransaction,
} from '@libs/domain';

export interface IntegrityValidationResult {
  membershipId: number;
  isValid: boolean;
  issues: string[];
  ledgerBalance: number;
  projectedBalance: number;
  difference: number;
}

/**
 * Servicio para validar integridad de datos del sistema de lealtad
 * Verifica que los balances proyectados coincidan con el ledger
 */
@Injectable()
export class IntegrityValidatorService {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  /**
   * Valida integridad de balances para una membership específica
   * Compara el balance proyectado (customer_memberships.points) con el balance calculado desde el ledger
   */
  async validateMembershipBalance(membershipId: number): Promise<IntegrityValidationResult> {
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    // Calcular balance desde el ledger
    const ledgerBalance = await this.pointsTransactionRepository.calculateBalance(membershipId);

    // Obtener balance proyectado
    const projectedBalance = membership.points;

    const difference = projectedBalance - ledgerBalance;
    const isValid = Math.abs(difference) < 0.01; // Tolerancia para errores de redondeo

    const issues: string[] = [];
    if (!isValid) {
      issues.push(
        `Balance mismatch: projected=${projectedBalance}, ledger=${ledgerBalance}, difference=${difference}`,
      );
    }

    return {
      membershipId,
      isValid,
      issues,
      ledgerBalance,
      projectedBalance,
      difference,
    };
  }

  /**
   * Valida integridad de balances para todas las memberships de un tenant
   */
  async validateTenantBalances(tenantId: number): Promise<IntegrityValidationResult[]> {
    const memberships = await this.membershipRepository.findByTenantId(tenantId);
    const results: IntegrityValidationResult[] = [];

    for (const membership of memberships) {
      try {
        const result = await this.validateMembershipBalance(membership.id);
        results.push(result);
      } catch (error) {
        results.push({
          membershipId: membership.id,
          isValid: false,
          issues: [
            `Error validating balance: ${error instanceof Error ? error.message : String(error)}`,
          ],
          ledgerBalance: 0,
          projectedBalance: membership.points,
          difference: membership.points,
        });
      }
    }

    return results;
  }

  /**
   * Valida que no haya transacciones duplicadas (mismo idempotencyKey)
   * Esto debería ser imposible debido a la constraint UNIQUE, pero es útil para auditoría
   */
  async validateIdempotency(membershipId: number): Promise<{
    isValid: boolean;
    issues: string[];
    duplicateKeys: string[];
  }> {
    const transactions = await this.pointsTransactionRepository.findByMembershipId(membershipId);

    // Agrupar por idempotencyKey
    const keyCounts = new Map<string, number>();
    for (const tx of transactions) {
      const count = keyCounts.get(tx.idempotencyKey) || 0;
      keyCounts.set(tx.idempotencyKey, count + 1);
    }

    const duplicateKeys: string[] = [];
    for (const [key, count] of keyCounts.entries()) {
      if (count > 1) {
        duplicateKeys.push(key);
      }
    }

    return {
      isValid: duplicateKeys.length === 0,
      issues:
        duplicateKeys.length > 0
          ? [
              `Found ${duplicateKeys.length} duplicate idempotency keys: ${duplicateKeys.join(', ')}`,
            ]
          : [],
      duplicateKeys,
    };
  }

  /**
   * Valida que las reversiones apunten a transacciones válidas
   */
  async validateReversals(membershipId: number): Promise<{
    isValid: boolean;
    issues: string[];
    invalidReversals: number[];
  }> {
    const transactions = await this.pointsTransactionRepository.findByMembershipId(membershipId);
    const reversals = transactions.filter((tx) => tx.type === 'REVERSAL');

    const invalidReversals: number[] = [];
    for (const reversal of reversals) {
      if (!reversal.reversalOfTransactionId) {
        invalidReversals.push(reversal.id);
        continue;
      }

      const original = await this.pointsTransactionRepository.findById(
        reversal.reversalOfTransactionId,
      );
      if (!original) {
        invalidReversals.push(reversal.id);
      }
    }

    return {
      isValid: invalidReversals.length === 0,
      issues:
        invalidReversals.length > 0
          ? [
              `Found ${invalidReversals.length} reversals pointing to invalid transactions: ${invalidReversals.join(', ')}`,
            ]
          : [],
      invalidReversals,
    };
  }

  /**
   * Ejecuta todas las validaciones de integridad para una membership
   */
  async validateAll(membershipId: number): Promise<{
    balance: IntegrityValidationResult;
    idempotency: { isValid: boolean; issues: string[]; duplicateKeys: string[] };
    reversals: { isValid: boolean; issues: string[]; invalidReversals: number[] };
    overallValid: boolean;
  }> {
    const balance = await this.validateMembershipBalance(membershipId);
    const idempotency = await this.validateIdempotency(membershipId);
    const reversals = await this.validateReversals(membershipId);

    const overallValid = balance.isValid && idempotency.isValid && reversals.isValid;

    return {
      balance,
      idempotency,
      reversals,
      overallValid,
    };
  }

  /**
   * Corrige balances inconsistentes recalculando desde el ledger
   * Útil para scripts de mantenimiento
   */
  async fixBalance(membershipId: number): Promise<CustomerMembership> {
    const result = await this.validateMembershipBalance(membershipId);
    if (result.isValid) {
      const membership = await this.membershipRepository.findById(membershipId);
      if (!membership) {
        throw new Error(`Membership ${membershipId} not found`);
      }
      return membership; // Ya está correcto
    }

    // Recalcular balance desde ledger y actualizar proyección
    const ledgerBalance = await this.pointsTransactionRepository.calculateBalance(membershipId);
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership ${membershipId} not found`);
    }

    // Actualizar balance usando el método especial del repositorio
    const updatedMembership = await this.membershipRepository.updateBalanceFromLedger(
      membershipId,
      ledgerBalance,
    );

    return updatedMembership;
  }
}
