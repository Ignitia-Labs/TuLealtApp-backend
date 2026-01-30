/**
 * Entidad de dominio Referral
 * Representa una relación de referido entre dos memberships
 * No depende de frameworks ni librerías externas
 *
 * HARD RULES:
 * - No self-referral (referrerMembershipId !== referredMembershipId)
 * - Un referido solo puede tener un referidor activo por tenant
 */

export type ReferralStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export class Referral {
  constructor(
    public readonly id: number,
    public readonly referrerMembershipId: number, // Membership del que refiere
    public readonly referredMembershipId: number, // Membership referido
    public readonly tenantId: number,
    public readonly status: ReferralStatus,
    public readonly referralCode: string | null, // Código de referido usado (opcional)
    public readonly firstPurchaseCompleted: boolean, // Si el referido completó su primera compra
    public readonly rewardGranted: boolean, // Si ya se otorgó la recompensa al referidor
    public readonly rewardGrantedAt: Date | null, // Fecha en que se otorgó la recompensa
    public readonly firstPurchaseCompletedAt: Date | null, // Fecha de primera compra del referido
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo referral
   * Valida que no sea self-referral
   */
  static create(
    referrerMembershipId: number,
    referredMembershipId: number,
    tenantId: number,
    referralCode: string | null = null,
    id?: number,
  ): Referral {
    // Validación: no self-referral
    if (referrerMembershipId === referredMembershipId) {
      throw new Error(
        'Cannot create self-referral (referrerMembershipId must be different from referredMembershipId)',
      );
    }

    const now = new Date();
    return new Referral(
      id || 0,
      referrerMembershipId,
      referredMembershipId,
      tenantId,
      'pending',
      referralCode,
      false, // firstPurchaseCompleted
      false, // rewardGranted
      null, // rewardGrantedAt
      null, // firstPurchaseCompletedAt
      now,
      now,
    );
  }

  /**
   * Método de dominio para marcar la primera compra como completada
   */
  markFirstPurchaseCompleted(): Referral {
    if (this.firstPurchaseCompleted) {
      return this; // Ya estaba completada
    }

    return new Referral(
      this.id,
      this.referrerMembershipId,
      this.referredMembershipId,
      this.tenantId,
      this.status === 'pending' ? 'active' : this.status, // Cambiar a active si estaba pending
      this.referralCode,
      true, // firstPurchaseCompleted
      this.rewardGranted,
      this.rewardGrantedAt,
      new Date(), // firstPurchaseCompletedAt
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para marcar la recompensa como otorgada
   */
  markRewardGranted(): Referral {
    if (this.rewardGranted) {
      return this; // Ya estaba otorgada
    }

    return new Referral(
      this.id,
      this.referrerMembershipId,
      this.referredMembershipId,
      this.tenantId,
      this.status === 'active' ? 'completed' : this.status, // Cambiar a completed si estaba active
      this.referralCode,
      this.firstPurchaseCompleted,
      true, // rewardGranted
      new Date(), // rewardGrantedAt
      this.firstPurchaseCompletedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para cancelar el referral
   */
  cancel(): Referral {
    if (this.status === 'cancelled') {
      return this; // Ya estaba cancelado
    }

    return new Referral(
      this.id,
      this.referrerMembershipId,
      this.referredMembershipId,
      this.tenantId,
      'cancelled',
      this.referralCode,
      this.firstPurchaseCompleted,
      this.rewardGranted,
      this.rewardGrantedAt,
      this.firstPurchaseCompletedAt,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para verificar si el referral está activo
   */
  isActive(): boolean {
    return this.status === 'active' || this.status === 'pending';
  }

  /**
   * Método de dominio para verificar si el referral está completado
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Método de dominio para verificar si el referral está cancelado
   */
  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /**
   * Método de dominio para verificar si la primera compra está completada
   */
  hasFirstPurchaseCompleted(): boolean {
    return this.firstPurchaseCompleted;
  }

  /**
   * Método de dominio para verificar si la recompensa ya fue otorgada
   */
  hasRewardBeenGranted(): boolean {
    return this.rewardGranted;
  }
}
