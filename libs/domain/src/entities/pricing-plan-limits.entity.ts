/**
 * Entidad de dominio PricingPlanLimits
 * Representa los límites de un plan de precios
 * No depende de frameworks ni librerías externas
 */
export class PricingPlanLimits {
  constructor(
    public readonly id: number,
    public readonly pricingPlanId: number,
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
   * Factory method para crear límites de plan de precios
   */
  static create(
    pricingPlanId: number,
    maxTenants: number,
    maxBranches: number,
    maxCustomers: number,
    maxRewards: number,
    maxAdmins: number,
    storageGB: number,
    apiCallsPerMonth: number,
    id?: number,
  ): PricingPlanLimits {
    const now = new Date();
    return new PricingPlanLimits(
      id || 0,
      pricingPlanId,
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
   * Método de dominio para verificar si los tenants son ilimitados
   */
  hasUnlimitedTenants(): boolean {
    return this.maxTenants === -1;
  }

  /**
   * Método de dominio para verificar si se puede crear un nuevo tenant
   */
  canCreateTenant(currentTenantsCount: number): boolean {
    return this.hasUnlimitedTenants() || currentTenantsCount < this.maxTenants;
  }

  /**
   * Método de dominio para verificar si se puede crear una nueva branch
   */
  canCreateBranch(currentBranchesCount: number): boolean {
    return this.maxBranches === -1 || currentBranchesCount < this.maxBranches;
  }

  /**
   * Método de dominio para verificar si se puede agregar más clientes
   */
  canAddCustomers(currentCustomersCount: number): boolean {
    return this.maxCustomers === -1 || currentCustomersCount < this.maxCustomers;
  }
}
