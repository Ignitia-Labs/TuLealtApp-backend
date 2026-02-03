/**
 * Entidad de dominio Coupon
 * Representa un cupón de descuento para suscripciones
 * No depende de frameworks ni librerías externas
 */
export type DiscountType = 'percentage' | 'fixed_amount';
export type CouponStatus = 'active' | 'inactive' | 'expired';

export class Coupon {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string,
    public readonly discountType: DiscountType,
    public readonly discountValue: number,
    public readonly currency: string | null,
    public readonly applicableFrequencies: ('monthly' | 'quarterly' | 'semiannual' | 'annual')[],
    public readonly maxUses: number | null,
    public readonly currentUses: number,
    public readonly maxUsesPerPartner: number | null,
    public readonly validFrom: Date,
    public readonly validUntil: Date | null,
    public readonly status: CouponStatus,
    public readonly createdBy: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo cupón
   */
  static create(
    code: string,
    name: string,
    description: string,
    discountType: DiscountType,
    discountValue: number,
    applicableFrequencies: ('monthly' | 'quarterly' | 'semiannual' | 'annual')[],
    validFrom: Date,
    createdBy: number,
    currency: string | null = null,
    maxUses: number | null = null,
    maxUsesPerPartner: number | null = null,
    validUntil: Date | null = null,
    status: CouponStatus = 'active',
    id?: number,
  ): Coupon {
    const now = new Date();
    return new Coupon(
      id || 0,
      code,
      name,
      description,
      discountType,
      discountValue,
      currency,
      applicableFrequencies,
      maxUses,
      0,
      maxUsesPerPartner,
      validFrom,
      validUntil,
      status,
      createdBy,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el cupón está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para verificar si el cupón ha expirado
   */
  isExpired(): boolean {
    if (this.validUntil === null) {
      return false;
    }
    return this.validUntil < new Date();
  }

  /**
   * Método de dominio para verificar si el cupón es válido para usar
   */
  isValid(): boolean {
    if (!this.isActive() || this.isExpired()) {
      return false;
    }
    if (this.validFrom > new Date()) {
      return false;
    }
    if (this.maxUses !== null && this.currentUses >= this.maxUses) {
      return false;
    }
    return true;
  }

  /**
   * Método de dominio para verificar si el cupón aplica a una frecuencia específica
   */
  appliesToFrequency(frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual'): boolean {
    return this.applicableFrequencies.includes(frequency);
  }

  /**
   * Método de dominio para calcular el descuento aplicado
   */
  calculateDiscount(amount: number): number {
    if (!this.isValid()) {
      return 0;
    }
    if (this.discountType === 'percentage') {
      return (amount * this.discountValue) / 100;
    } else {
      // fixed_amount
      return Math.min(this.discountValue, amount);
    }
  }

  /**
   * Método de dominio para incrementar el contador de usos
   */
  incrementUses(): Coupon {
    const newUses = this.currentUses + 1;
    const newStatus = this.maxUses !== null && newUses >= this.maxUses ? 'expired' : this.status;
    return new Coupon(
      this.id,
      this.code,
      this.name,
      this.description,
      this.discountType,
      this.discountValue,
      this.currency,
      this.applicableFrequencies,
      this.maxUses,
      newUses,
      this.maxUsesPerPartner,
      this.validFrom,
      this.validUntil,
      newStatus,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }
}
