/**
 * Entidad de dominio Branch
 * Representa una sucursal de un tenant
 * No depende de frameworks ni librerías externas
 */
export class Branch {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    public readonly address: string,
    public readonly city: string,
    public readonly country: string,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly quickSearchCode: string,
    public readonly status: 'active' | 'inactive' | 'closed',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva branch
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    tenantId: number,
    name: string,
    address: string,
    city: string,
    country: string,
    quickSearchCode: string,
    phone: string | null = null,
    email: string | null = null,
    status: 'active' | 'inactive' | 'closed' = 'active',
    id?: number,
  ): Branch {
    const now = new Date();
    return new Branch(
      id || 0,
      tenantId,
      name,
      address,
      city,
      country,
      phone,
      email,
      quickSearchCode,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la branch está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para cerrar la branch
   */
  close(): Branch {
    return new Branch(
      this.id,
      this.tenantId,
      this.name,
      this.address,
      this.city,
      this.country,
      this.phone,
      this.email,
      this.quickSearchCode,
      'closed',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para activar la branch
   */
  activate(): Branch {
    return new Branch(
      this.id,
      this.tenantId,
      this.name,
      this.address,
      this.city,
      this.country,
      this.phone,
      this.email,
      this.quickSearchCode,
      'active',
      this.createdAt,
      new Date(),
    );
  }
}
