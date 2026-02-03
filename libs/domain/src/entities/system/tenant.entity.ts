/**
 * Entidad de dominio Tenant
 * Representa un tenant (negocio) en el dominio
 * No depende de frameworks ni librerías externas
 *
 * IMPORTANTE: Los campos `pointsExpireDays` y `minPointsToRedeem` son valores por defecto
 * para programas de lealtad base. Los programas específicos (LoyaltyProgram) pueden
 * sobrescribir estos valores. Use `LoyaltyProgramConfigResolver` para resolver el valor
 * correcto considerando la precedencia: LoyaltyProgram > Tenant.
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
    /**
     * Días hasta que expiren los puntos (valor por defecto para programas base)
     * Los programas específicos (LoyaltyProgram) pueden sobrescribir este valor
     * mediante expirationPolicy.daysToExpire
     * @see LoyaltyProgram.expirationPolicy
     */
    public readonly pointsExpireDays: number,
    /**
     * Puntos mínimos para canjear (valor por defecto para programas base)
     * Los programas específicos (LoyaltyProgram) pueden sobrescribir este valor
     * mediante minPointsToRedeem
     * @see LoyaltyProgram.minPointsToRedeem
     */
    public readonly minPointsToRedeem: number,
    /**
     * Porcentaje de impuestos aplicable al tenant
     * Valor por defecto: 0 (sin impuestos)
     */
    public readonly taxPercentage: number,
    public readonly quickSearchCode: string,
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
    quickSearchCode: string,
    pointsExpireDays: number = 365,
    minPointsToRedeem: number = 100,
    description: string | null = null,
    logo: string | null = null,
    banner: string | null = null,
    status: 'active' | 'inactive' | 'suspended' = 'active',
    taxPercentage: number = 0,
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
      taxPercentage,
      quickSearchCode,
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
      this.taxPercentage,
      this.quickSearchCode,
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
      this.taxPercentage,
      this.quickSearchCode,
      'active',
      this.createdAt,
      new Date(),
    );
  }
}
