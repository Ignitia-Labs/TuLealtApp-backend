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
    public readonly loyaltyProgramsCount: number,
    public readonly loyaltyProgramsBaseCount: number,
    public readonly loyaltyProgramsPromoCount: number,
    public readonly loyaltyProgramsPartnerCount: number,
    public readonly loyaltyProgramsSubscriptionCount: number,
    public readonly loyaltyProgramsExperimentalCount: number,
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
    loyaltyProgramsCount: number = 0,
    loyaltyProgramsBaseCount: number = 0,
    loyaltyProgramsPromoCount: number = 0,
    loyaltyProgramsPartnerCount: number = 0,
    loyaltyProgramsSubscriptionCount: number = 0,
    loyaltyProgramsExperimentalCount: number = 0,
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
      loyaltyProgramsCount,
      loyaltyProgramsBaseCount,
      loyaltyProgramsPromoCount,
      loyaltyProgramsPartnerCount,
      loyaltyProgramsSubscriptionCount,
      loyaltyProgramsExperimentalCount,
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
      this.loyaltyProgramsCount,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
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
      this.loyaltyProgramsCount,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
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
      this.loyaltyProgramsCount,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
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
      this.loyaltyProgramsCount,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo total de loyalty programs
   */
  incrementLoyaltyProgramsCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.loyaltyProgramsCount + 1,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de loyalty programs tipo BASE
   */
  incrementLoyaltyProgramsBaseCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.loyaltyProgramsCount + 1,
      this.loyaltyProgramsBaseCount + 1,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de loyalty programs tipo PROMO
   */
  incrementLoyaltyProgramsPromoCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.loyaltyProgramsCount + 1,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount + 1,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de loyalty programs tipo PARTNER
   */
  incrementLoyaltyProgramsPartnerCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.loyaltyProgramsCount + 1,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount + 1,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de loyalty programs tipo SUBSCRIPTION
   */
  incrementLoyaltyProgramsSubscriptionCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.loyaltyProgramsCount + 1,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount + 1,
      this.loyaltyProgramsExperimentalCount,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para incrementar el conteo de loyalty programs tipo EXPERIMENTAL
   */
  incrementLoyaltyProgramsExperimentalCount(): PartnerSubscriptionUsage {
    return new PartnerSubscriptionUsage(
      this.id,
      this.partnerSubscriptionId,
      this.tenantsCount,
      this.branchesCount,
      this.customersCount,
      this.rewardsCount,
      this.loyaltyProgramsCount + 1,
      this.loyaltyProgramsBaseCount,
      this.loyaltyProgramsPromoCount,
      this.loyaltyProgramsPartnerCount,
      this.loyaltyProgramsSubscriptionCount,
      this.loyaltyProgramsExperimentalCount + 1,
      this.createdAt,
      new Date(),
    );
  }
}
