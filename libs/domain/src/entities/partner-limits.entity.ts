/**
 * Entidad de dominio PartnerLimits
 * Representa los límites de un partner según su plan
 * No depende de frameworks ni librerías externas
 */
export class PartnerLimits {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly maxTenants: number, // -1 para ilimitado
    public readonly maxBranches: number, // -1 para ilimitado
    public readonly maxCustomers: number, // -1 para ilimitado
    public readonly maxRewards: number, // -1 para ilimitado
    public readonly maxAdmins: number, // -1 para ilimitado
    public readonly storageGB: number, // -1 para ilimitado
    public readonly apiCallsPerMonth: number, // -1 para ilimitado
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear límites de partner
   */
  static create(
    partnerId: number,
    maxTenants: number,
    maxBranches: number,
    maxCustomers: number,
    maxRewards: number,
    maxAdmins: number,
    storageGB: number,
    apiCallsPerMonth: number,
    id?: number,
  ): PartnerLimits {
    const now = new Date();
    return new PartnerLimits(
      id || 0,
      partnerId,
      maxTenants,
      maxBranches,
      maxCustomers,
      maxRewards,
      maxAdmins,
      storageGB,
      apiCallsPerMonth,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si se puede crear un nuevo tenant
   */
  canCreateTenant(currentTenantsCount: number): boolean {
    return currentTenantsCount < this.maxTenants || this.maxTenants === 999;
  }

  /**
   * Método de dominio para verificar si se puede crear una nueva branch
   */
  canCreateBranch(currentBranchesCount: number): boolean {
    return currentBranchesCount < this.maxBranches || this.maxBranches === 999;
  }
}
