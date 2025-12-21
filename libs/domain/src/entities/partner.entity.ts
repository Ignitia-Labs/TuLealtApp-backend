/**
 * Entidad de dominio Partner
 * Representa un partner en el dominio de negocio
 * No depende de frameworks ni librerías externas
 */
export class Partner {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly responsibleName: string,
    public readonly email: string,
    public readonly phone: string,
    public readonly country: string,
    public readonly city: string,
    public readonly plan: string,
    public readonly logo: string | null,
    public readonly category: string,
    public readonly branchesNumber: number,
    public readonly website: string | null,
    public readonly socialMedia: string | null,
    public readonly rewardType: string,
    public readonly currencyId: string,
    public readonly businessName: string,
    public readonly taxId: string,
    public readonly fiscalAddress: string,
    public readonly paymentMethod: string,
    public readonly billingEmail: string,
    public readonly domain: string,
    public readonly status: 'active' | 'suspended' | 'inactive',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo partner
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    name: string,
    responsibleName: string,
    email: string,
    phone: string,
    country: string,
    city: string,
    plan: string,
    category: string,
    rewardType: string,
    currencyId: string,
    businessName: string,
    taxId: string,
    fiscalAddress: string,
    paymentMethod: string,
    billingEmail: string,
    domain: string,
    logo: string | null = null,
    branchesNumber: number = 0,
    website: string | null = null,
    socialMedia: string | null = null,
    status: 'active' | 'suspended' | 'inactive' = 'active',
    id?: number,
  ): Partner {
    const now = new Date();
    return new Partner(
      id || 0,
      name,
      responsibleName,
      email,
      phone,
      country,
      city,
      plan,
      logo,
      category,
      branchesNumber,
      website,
      socialMedia,
      rewardType,
      currencyId,
      businessName,
      taxId,
      fiscalAddress,
      paymentMethod,
      billingEmail,
      domain,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el partner está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para suspender el partner
   */
  suspend(): Partner {
    return new Partner(
      this.id,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.country,
      this.city,
      this.plan,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.domain,
      'suspended',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar el partner
   */
  activate(): Partner {
    return new Partner(
      this.id,
      this.name,
      this.responsibleName,
      this.email,
      this.phone,
      this.country,
      this.city,
      this.plan,
      this.logo,
      this.category,
      this.branchesNumber,
      this.website,
      this.socialMedia,
      this.rewardType,
      this.currencyId,
      this.businessName,
      this.taxId,
      this.fiscalAddress,
      this.paymentMethod,
      this.billingEmail,
      this.domain,
      'active',
      this.createdAt,
      new Date(),
    );
  }
}
