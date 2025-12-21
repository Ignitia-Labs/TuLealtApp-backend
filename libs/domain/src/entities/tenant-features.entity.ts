/**
 * Entidad de dominio TenantFeatures
 * Representa las características habilitadas de un tenant
 * No depende de frameworks ni librerías externas
 */
export class TenantFeatures {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly qrScanning: boolean,
    public readonly offlineMode: boolean,
    public readonly referralProgram: boolean,
    public readonly birthdayRewards: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear características de tenant
   */
  static create(
    tenantId: number,
    qrScanning: boolean = true,
    offlineMode: boolean = true,
    referralProgram: boolean = true,
    birthdayRewards: boolean = true,
    id?: number,
  ): TenantFeatures {
    const now = new Date();
    return new TenantFeatures(
      id || 0,
      tenantId,
      qrScanning,
      offlineMode,
      referralProgram,
      birthdayRewards,
      now,
      now,
    );
  }

  /**
   * Método de dominio para actualizar características
   */
  updateFeatures(
    qrScanning?: boolean,
    offlineMode?: boolean,
    referralProgram?: boolean,
    birthdayRewards?: boolean,
  ): TenantFeatures {
    return new TenantFeatures(
      this.id,
      this.tenantId,
      qrScanning ?? this.qrScanning,
      offlineMode ?? this.offlineMode,
      referralProgram ?? this.referralProgram,
      birthdayRewards ?? this.birthdayRewards,
      this.createdAt,
      new Date(),
    );
  }
}
