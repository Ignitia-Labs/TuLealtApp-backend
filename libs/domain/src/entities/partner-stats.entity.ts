/**
 * Entidad de dominio PartnerStats
 * Representa las estadísticas actuales de un partner
 * No depende de frameworks ni librerías externas
 */
export class PartnerStats {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly tenantsCount: number,
    public readonly branchesCount: number,
    public readonly customersCount: number,
    public readonly rewardsCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear estadísticas de partner
   */
  static create(
    partnerId: number,
    tenantsCount: number = 0,
    branchesCount: number = 0,
    customersCount: number = 0,
    rewardsCount: number = 0,
    id?: number,
  ): PartnerStats {
    const now = new Date();
    return new PartnerStats(
      id || 0,
      partnerId,
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
  incrementTenantsCount(): PartnerStats {
    return new PartnerStats(
      this.id,
      this.partnerId,
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
  incrementBranchesCount(): PartnerStats {
    return new PartnerStats(
      this.id,
      this.partnerId,
      this.tenantsCount,
      this.branchesCount + 1,
      this.customersCount,
      this.rewardsCount,
      this.createdAt,
      new Date(),
    );
  }
}
