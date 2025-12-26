/**
 * Entidad de dominio SavedPaymentMethod
 * Representa un método de pago guardado de un partner
 * No depende de frameworks ni librerías externas
 */
export type PaymentMethodType = 'credit_card' | 'bank_transfer' | 'debit_card';
export type AccountType = 'checking' | 'savings';

export class SavedPaymentMethod {
  constructor(
    public readonly id: number,
    public readonly partnerId: number,
    public readonly type: PaymentMethodType,
    public readonly cardLastFour: string | null,
    public readonly cardBrand: string | null,
    public readonly cardExpiry: string | null,
    public readonly cardHolderName: string | null,
    public readonly bankName: string | null,
    public readonly accountLastFour: string | null,
    public readonly accountType: AccountType | null,
    public readonly isDefault: boolean,
    public readonly isActive: boolean,
    public readonly gateway: string | null,
    public readonly gatewayCustomerId: string | null,
    public readonly gatewayPaymentMethodId: string | null,
    public readonly nickname: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastUsedAt: Date | null,
  ) {}

  /**
   * Factory method para crear un nuevo método de pago guardado
   */
  static create(
    partnerId: number,
    type: PaymentMethodType,
    isDefault: boolean = false,
    isActive: boolean = true,
    cardLastFour: string | null = null,
    cardBrand: string | null = null,
    cardExpiry: string | null = null,
    cardHolderName: string | null = null,
    bankName: string | null = null,
    accountLastFour: string | null = null,
    accountType: AccountType | null = null,
    gateway: string | null = null,
    gatewayCustomerId: string | null = null,
    gatewayPaymentMethodId: string | null = null,
    nickname: string | null = null,
    id?: number,
  ): SavedPaymentMethod {
    const now = new Date();
    return new SavedPaymentMethod(
      id || 0,
      partnerId,
      type,
      cardLastFour,
      cardBrand,
      cardExpiry,
      cardHolderName,
      bankName,
      accountLastFour,
      accountType,
      isDefault,
      isActive,
      gateway,
      gatewayCustomerId,
      gatewayPaymentMethodId,
      nickname,
      now,
      now,
      null,
    );
  }

  /**
   * Método de dominio para verificar si el método está activo
   */
  isActiveMethod(): boolean {
    return this.isActive;
  }

  /**
   * Método de dominio para marcar como método por defecto
   */
  setAsDefault(): SavedPaymentMethod {
    return new SavedPaymentMethod(
      this.id,
      this.partnerId,
      this.type,
      this.cardLastFour,
      this.cardBrand,
      this.cardExpiry,
      this.cardHolderName,
      this.bankName,
      this.accountLastFour,
      this.accountType,
      true,
      this.isActive,
      this.gateway,
      this.gatewayCustomerId,
      this.gatewayPaymentMethodId,
      this.nickname,
      this.createdAt,
      new Date(),
      this.lastUsedAt,
    );
  }

  /**
   * Método de dominio para desactivar el método
   */
  deactivate(): SavedPaymentMethod {
    return new SavedPaymentMethod(
      this.id,
      this.partnerId,
      this.type,
      this.cardLastFour,
      this.cardBrand,
      this.cardExpiry,
      this.cardHolderName,
      this.bankName,
      this.accountLastFour,
      this.accountType,
      false, // No puede ser default si está inactivo
      false,
      this.gateway,
      this.gatewayCustomerId,
      this.gatewayPaymentMethodId,
      this.nickname,
      this.createdAt,
      new Date(),
      this.lastUsedAt,
    );
  }

  /**
   * Método de dominio para registrar uso del método
   */
  recordUsage(): SavedPaymentMethod {
    return new SavedPaymentMethod(
      this.id,
      this.partnerId,
      this.type,
      this.cardLastFour,
      this.cardBrand,
      this.cardExpiry,
      this.cardHolderName,
      this.bankName,
      this.accountLastFour,
      this.accountType,
      this.isDefault,
      this.isActive,
      this.gateway,
      this.gatewayCustomerId,
      this.gatewayPaymentMethodId,
      this.nickname,
      this.createdAt,
      new Date(),
      new Date(),
    );
  }
}

