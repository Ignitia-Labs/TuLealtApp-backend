/**
 * Entidad de dominio PartnerSubscriptionUsage
 * Representa el uso actual de una suscripción de partner
 * No depende de frameworks ni librerías externas
 */
export class PartnerSubscriptionUsage {
  constructor(
    public readonly id: number,
    public readonly partnerSubscriptionId: number,
    public readonly tenantsCount: number,
    public readonly branchesCount: number,
    public readonly customersCount: number,
    public readonly rewardsCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear uso de suscripción
   */
  static create(
    partnerSubscriptionId: number,
    tenantsCount: number = 0,
    branchesCount: number = 0,
    customersCount: number = 0,
    rewardsCount: number = 0,
    id?: number,
  ): PartnerSubscriptionUsage {
    const now = new Date();
    return new PartnerSubscriptionUsage(
      id || 0,
      partnerSubscriptionId,
      tenantsCount,
      branchesCount,
      customersCount,
      rewardsCount,
      now,
      now,
    );
  }

  /**
   * Método de dominio para incrementar el conteo de tenants
   */
  incrementTenantsCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount + 1,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de branches
   */
  incrementBranchesCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount + 1,
      this.customersCount,
      this.rewardsCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de customers
   */
  incrementCustomersCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount + 1,
      this.rewardsCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de rewards
   */
  incrementRewardsCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount + 1,
      this.createdAt,
      new Date(),
    );
  }
}
