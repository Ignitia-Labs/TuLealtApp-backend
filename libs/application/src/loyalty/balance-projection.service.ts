import { Injectable, Inject } from '@nestjs/common';
import {
  IPointsTransactionRepository,
  ICustomerMembershipRepository,
  CustomerMembership,
} from '@libs/domain';

/**
 * Servicio para calcular y proyectar balances desde el ledger
 * El ledger (points_transactions) es la fuente de verdad
 * Este servicio calcula balances y actualiza proyecciones en customer_memberships.points
 */
@Injectable()
export class BalanceProjectionService {
  constructor(
    @Inject('IPointsTransactionRepository')
    private readonly pointsTransactionRepository: IPointsTransactionRepository,
    @Inject('ICustomerMembershipRepository')
    private readonly membershipRepository: ICustomerMembershipRepository,
  ) {}

  /**
   * Calcula el balance total de una membership sumando todos los pointsDelta del ledger
   * @param membershipId ID de la membership
   * @returns Balance total calculado desde el ledger
   */
  async calculateMembershipBalance(membershipId: number): Promise<number> {
    return await this.pointsTransactionRepository.calculateBalance(membershipId);
  }

  /**
   * Calcula el balance de una membership para un programa específico
   * Solo suma transacciones asociadas a ese programa
   * @param membershipId ID de la membership
   * @param programId ID del programa
   * @returns Balance del programa calculado desde el ledger
   */
  async calculateProgramBalance(membershipId: number, programId: number): Promise<number> {
    return await this.pointsTransactionRepository.calculateBalanceByProgram(
      membershipId,
      programId,
    );
  }

  /**
   * Recalcula el balance de una membership desde el ledger y actualiza la proyección
   * Este es el ÚNICO método permitido para actualizar customer_memberships.points
   * @param membershipId ID de la membership
   * @returns Membership actualizada con balance recalculado
   */
  async recalculateBalance(membershipId: number): Promise<CustomerMembership> {
    // 1. Calcular balance desde ledger
    const calculatedBalance = await this.calculateMembershipBalance(membershipId);

    // 2. Obtener membership actual
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      throw new Error(`Membership with ID ${membershipId} not found`);
    }

    // 3. Actualizar balance usando el método especial del repositorio
    return await this.membershipRepository.updateBalanceFromLedger(membershipId, calculatedBalance);
  }

  /**
   * Recalcula el balance de múltiples memberships en batch
   * Útil para reparación o sincronización masiva
   * @param membershipIds Array de IDs de memberships
   * @returns Array de memberships actualizadas
   */
  async recalculateBalancesBatch(membershipIds: number[]): Promise<CustomerMembership[]> {
    const updatedMemberships: CustomerMembership[] = [];

    for (const membershipId of membershipIds) {
      try {
        const updated = await this.recalculateBalance(membershipId);
        updatedMemberships.push(updated);
      } catch (error) {
        // Log error pero continuar con otras memberships
        console.error(`Error recalculating balance for membership ${membershipId}:`, error);
      }
    }

    return updatedMemberships;
  }

  /**
   * Verifica si el balance proyectado coincide con el balance calculado del ledger
   * Útil para validación de integridad
   * @param membershipId ID de la membership
   * @returns true si coinciden, false si hay discrepancia
   */
  async validateBalanceIntegrity(membershipId: number): Promise<boolean> {
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership) {
      return false;
    }

    const calculatedBalance = await this.calculateMembershipBalance(membershipId);

    // Comparar con tolerancia de redondeo (por si hay diferencias de precisión)
    return Math.abs(membership.points - calculatedBalance) < 0.01;
  }
}
