/**
 * Entidad de dominio InvitationCode
 * Representa un código de invitación para registro de clientes
 * No depende de frameworks ni librerías externas
 */
export type InvitationCodeType = 'text' | 'qr';
export type InvitationCodeStatus = 'active' | 'expired' | 'disabled';

export class InvitationCode {
  constructor(
    public readonly id: number,
    public readonly code: string,
    public readonly tenantId: number,
    public readonly branchId: number | null,
    public readonly type: InvitationCodeType,
    public readonly maxUses: number | null, // null para ilimitado
    public readonly currentUses: number,
    public readonly expiresAt: Date | null,
    public readonly status: InvitationCodeStatus,
    public readonly createdBy: number, // ID del usuario que creó el código
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo código de invitación
   */
  static create(
    code: string,
    tenantId: number,
    createdBy: number,
    type: InvitationCodeType = 'text',
    branchId: number | null = null,
    maxUses: number | null = null,
    expiresAt: Date | null = null,
    status: InvitationCodeStatus = 'active',
    id?: number,
  ): InvitationCode {
    const now = new Date();
    return new InvitationCode(
      id || 0,
      code,
      tenantId,
      branchId,
      type,
      maxUses,
      0,
      expiresAt,
      status,
      createdBy,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el código está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para verificar si el código ha expirado
   */
  isExpired(): boolean {
    if (this.expiresAt === null) {
      return false;
    }
    return this.expiresAt < new Date();
  }

  /**
   * Método de dominio para verificar si el código ha alcanzado el límite de usos
   */
  hasReachedLimit(): boolean {
    if (this.maxUses === null) {
      return false;
    }
    return this.currentUses >= this.maxUses;
  }

  /**
   * Método de dominio para verificar si el código es válido para usar
   */
  isValid(): boolean {
    return this.isActive() && !this.isExpired() && !this.hasReachedLimit();
  }

  /**
   * Método de dominio para incrementar el contador de usos
   */
  incrementUses(): InvitationCode {
    return new InvitationCode(
      this.id,
      this.code,
      this.tenantId,
      this.branchId,
      this.type,
      this.maxUses,
      this.currentUses + 1,
      this.expiresAt,
      this.hasReachedLimit() ? 'expired' : this.status,
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar el código
   */
  disable(): InvitationCode {
    return new InvitationCode(
      this.id,
      this.code,
      this.tenantId,
      this.branchId,
      this.type,
      this.maxUses,
      this.currentUses,
      this.expiresAt,
      'disabled',
      this.createdBy,
      this.createdAt,
      new Date(),
    );
  }
}

