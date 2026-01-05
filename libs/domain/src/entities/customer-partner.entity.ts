/**
 * Entidad de dominio CustomerPartner
 * Representa la asociación de un customer con un partner
 * No depende de frameworks ni librerías externas
 */
export type CustomerPartnerStatus = 'active' | 'inactive' | 'suspended';

export class CustomerPartner {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly partnerId: number,
    public readonly tenantId: number,
    public readonly registrationBranchId: number | null,
    public readonly status: CustomerPartnerStatus,
    public readonly joinedDate: Date,
    public readonly lastActivityDate: Date | null,
    public readonly metadata: Record<string, any> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva asociación customer-partner
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    userId: number,
    partnerId: number,
    tenantId: number,
    registrationBranchId: number,
    metadata?: Record<string, any> | null,
    id?: number,
  ): CustomerPartner {
    const now = new Date();
    return new CustomerPartner(
      id || 0,
      userId,
      partnerId,
      tenantId,
      registrationBranchId,
      'active',
      now,
      null,
      metadata || null,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la asociación está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para activar la asociación
   */
  activate(): CustomerPartner {
    return new CustomerPartner(
      this.id,
      this.userId,
      this.partnerId,
      this.tenantId,
      this.registrationBranchId,
      'active',
      this.joinedDate,
      this.lastActivityDate,
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar la asociación
   */
  deactivate(): CustomerPartner {
    return new CustomerPartner(
      this.id,
      this.userId,
      this.partnerId,
      this.tenantId,
      this.registrationBranchId,
      'inactive',
      this.joinedDate,
      this.lastActivityDate,
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para suspender la asociación
   */
  suspend(): CustomerPartner {
    return new CustomerPartner(
      this.id,
      this.userId,
      this.partnerId,
      this.tenantId,
      this.registrationBranchId,
      'suspended',
      this.joinedDate,
      this.lastActivityDate,
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar la última actividad
   */
  updateLastActivity(): CustomerPartner {
    return new CustomerPartner(
      this.id,
      this.userId,
      this.partnerId,
      this.tenantId,
      this.registrationBranchId,
      this.status,
      this.joinedDate,
      new Date(),
      this.metadata,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar los metadatos
   */
  updateMetadata(metadata: Record<string, any> | null): CustomerPartner {
    return new CustomerPartner(
      this.id,
      this.userId,
      this.partnerId,
      this.tenantId,
      this.registrationBranchId,
      this.status,
      this.joinedDate,
      this.lastActivityDate,
      metadata,
      this.createdAt,
      new Date(),
    );
  }
}
