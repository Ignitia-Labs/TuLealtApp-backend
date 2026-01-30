import {
  CustomerMembership,
  ICustomerTierRepository,
  ICustomerMembershipRepository,
} from '@libs/domain';
import { BalanceProjectionService } from '../../loyalty/balance-projection.service';

/**
 * Helper para recalcular el tier de una membership basado en sus puntos actuales
 * Este helper asegura que el tierId siempre esté sincronizado con los puntos
 */
export class TierCalculatorHelper {
  /**
   * Recalcula y actualiza el tier de una membership basado en sus puntos actuales
   *
   * @param membership - La membership a actualizar
   * @param tierRepository - Repositorio para buscar tiers
   * @returns La membership actualizada con el tier correcto
   */
  static async recalculateTier(
    membership: CustomerMembership,
    tierRepository: ICustomerTierRepository,
  ): Promise<CustomerMembership> {
    // Buscar el tier correspondiente a los puntos actuales
    const tier = await tierRepository.findByPoints(membership.tenantId, membership.points);

    // Si se encontró un tier y es diferente al actual, actualizar
    const newTierId = tier ? tier.id : null;
    if (newTierId !== membership.tierId) {
      return membership.updateTier(newTierId);
    }

    // Si no hay cambio, retornar la membership sin modificar
    return membership;
  }

  /**
   * Recalcula el tier de una membership basado en el balance del ledger
   * Este es el método recomendado para recalcular tiers después de cambios en el ledger
   *
   * @param membershipId - ID de la membership a actualizar
   * @param balanceProjectionService - Servicio para calcular balance desde ledger
   * @param membershipRepository - Repositorio de memberships
   * @param tierRepository - Repositorio para buscar tiers
   * @returns La membership actualizada con tier correcto basado en balance del ledger
   */
  static async recalculateTierFromLedger(
    membershipId: number,
    balanceProjectionService: BalanceProjectionService,
    membershipRepository: ICustomerMembershipRepository,
    tierRepository: ICustomerTierRepository,
  ): Promise<CustomerMembership> {
    // 1. Recalcular balance desde ledger
    const updatedMembership = await balanceProjectionService.recalculateBalance(membershipId);

    // 2. Recalcular tier basado en el balance proyectado
    return this.recalculateTier(updatedMembership, tierRepository);
  }

  /**
   * Agrega puntos a una membership y recalcula el tier automáticamente
   *
   * @deprecated Este método está deprecado. Los puntos deben actualizarse a través del ledger (PointsTransaction).
   * Este método será removido en una versión futura. Use el sistema de ledger + BalanceProjectionService.
   * @see PointsTransaction
   *
   * @param membership - La membership a actualizar
   * @param points - Cantidad de puntos a agregar
   * @param tierRepository - Repositorio para buscar tiers
   * @returns La membership actualizada con puntos y tier correctos
   */
  static async addPointsAndRecalculateTier(
    membership: CustomerMembership,
    points: number,
    tierRepository: ICustomerTierRepository,
  ): Promise<CustomerMembership> {
    // Agregar puntos usando el método de dominio
    const updatedMembership = membership.addPoints(points);

    // Recalcular tier basado en los nuevos puntos
    return this.recalculateTier(updatedMembership, tierRepository);
  }

  /**
   * Resta puntos de una membership y recalcula el tier automáticamente
   *
   * @deprecated Este método está deprecado. Los puntos deben actualizarse a través del ledger (PointsTransaction).
   * Este método será removido en una versión futura. Use el sistema de ledger + BalanceProjectionService.
   * @see PointsTransaction
   *
   * @param membership - La membership a actualizar
   * @param points - Cantidad de puntos a restar
   * @param tierRepository - Repositorio para buscar tiers
   * @returns La membership actualizada con puntos y tier correctos
   */
  static async subtractPointsAndRecalculateTier(
    membership: CustomerMembership,
    points: number,
    tierRepository: ICustomerTierRepository,
  ): Promise<CustomerMembership> {
    // Restar puntos usando el método de dominio
    const updatedMembership = membership.subtractPoints(points);

    // Recalcular tier basado en los nuevos puntos
    return this.recalculateTier(updatedMembership, tierRepository);
  }
}
