/**
 * Entidad de dominio Tenant
 * Representa un tenant (negocio) en el dominio
 * No depende de frameworks ni librerías externas
 */
export class Tenant {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly logo: string | null,
    public readonly banner: string | null,
    public readonly category: string,
    public readonly currencyId: number,
    public readonly primaryColor: string,
    public readonly secondaryColor: string,
    public readonly pointsExpireDays: number,
    public readonly minPointsToRedeem: number,
    public readonly status: 'active' | 'inactive' | 'suspended',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo tenant
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    partnerId: number,
    name: string,
    category: string,
    currencyId: number,
    primaryColor: string,
    secondaryColor: string,
    pointsExpireDays: number = 365,
    minPointsToRedeem: number = 100,
    description: string | null = null,
    logo: string | null = null,
    banner: string | null = null,
    status: 'active' | 'inactive' | 'suspended' = 'active',
    id?: number,
  ): Tenant {
    const now = new Date();
    return new Tenant(
      id || 0,
      partnerId,
      name,
      description,
      logo,
      banner,
      category,
      currencyId,
      primaryColor,
      secondaryColor,
      pointsExpireDays,
      minPointsToRedeem,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el tenant está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para suspender el tenant
   */
  suspend(): Tenant {
    return new Tenant(
      this.id,
      this.partnerId,
      this.name,
      this.description,
      this.logo,
      this.banner,
      this.category,
      this.currencyId,
      this.primaryColor,
      this.secondaryColor,
      this.pointsExpireDays,
      this.minPointsToRedeem,
      'suspended',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar el tenant
   */
  activate(): Tenant {
    return new Tenant(
      this.id,
      this.partnerId,
      this.name,
      this.description,
      this.logo,
      this.banner,
      this.category,
      this.currencyId,
      this.primaryColor,
      this.secondaryColor,
      this.pointsExpireDays,
      this.minPointsToRedeem,
      'active',
      this.createdAt,
      new Date(),
    );
  }
}
