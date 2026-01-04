/**
 * Entidad de dominio User
 * Representa un usuario en el dominio de negocio
 * No depende de frameworks ni librerías externas
 */
export type UserStatus = 'active' | 'inactive' | 'suspended';

export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly name: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
    public readonly profile: Record<string, any> | null,
    public readonly passwordHash: string,
    public readonly roles: string[],
    public readonly isActive: boolean, // Mantener para compatibilidad
    public readonly partnerId: number | null,
    public readonly tenantId: number | null,
    public readonly branchId: number | null,
    public readonly avatar: string | null,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo usuario
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    email: string,
    name: string,
    firstName: string,
    lastName: string,
    phone: string,
    passwordHash: string,
    roles: string[] = ['CUSTOMER'],
    profile: Record<string, any> | null = null,
    partnerId: number | null = null,
    tenantId: number | null = null,
    branchId: number | null = null,
    avatar: string | null = null,
    status: UserStatus = 'active',
    id?: number,
  ): User {
    const now = new Date();
    return new User(
      id || 0,
      email,
      name,
      firstName,
      lastName,
      phone,
      profile,
      passwordHash,
      roles,
      status === 'active', // isActive basado en status
      partnerId,
      tenantId,
      branchId,
      avatar,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el usuario está activo
   */
  isActiveUser(): boolean {
    return this.status === 'active' && this.isActive;
  }

  /**
   * Método de dominio para verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.roles.includes(role);
  }

  /**
   * Método de dominio para bloquear un usuario
   */
  lock(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.phone,
      this.profile,
      this.passwordHash,
      this.roles,
      false,
      this.partnerId,
      this.tenantId,
      this.branchId,
      this.avatar,
      'inactive',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desbloquear un usuario
   */
  unlock(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.phone,
      this.profile,
      this.passwordHash,
      this.roles,
      true,
      this.partnerId,
      this.tenantId,
      this.branchId,
      this.avatar,
      'active',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para suspender un usuario
   */
  suspend(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.phone,
      this.profile,
      this.passwordHash,
      this.roles,
      false,
      this.partnerId,
      this.tenantId,
      this.branchId,
      this.avatar,
      'suspended',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar el perfil del usuario
   */
  updateProfile(
    firstName?: string,
    lastName?: string,
    email?: string,
    phone?: string,
    profile?: Record<string, any> | null,
    name?: string,
    avatar?: string | null,
  ): User {
    return new User(
      this.id,
      email ?? this.email,
      name ?? this.name,
      firstName ?? this.firstName,
      lastName ?? this.lastName,
      phone ?? this.phone,
      profile !== undefined ? profile : this.profile,
      this.passwordHash,
      this.roles,
      this.isActive,
      this.partnerId,
      this.tenantId,
      this.branchId,
      avatar !== undefined ? avatar : this.avatar,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar la contraseña del usuario
   */
  updatePassword(newPasswordHash: string): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.phone,
      this.profile,
      newPasswordHash,
      this.roles,
      this.isActive,
      this.partnerId,
      this.tenantId,
      this.branchId,
      this.avatar,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar tenantId y branchId del usuario
   * Solo válido para usuarios PARTNER y PARTNER_STAFF
   */
  updateTenantAndBranch(tenantId?: number | null, branchId?: number | null): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.firstName,
      this.lastName,
      this.phone,
      this.profile,
      this.passwordHash,
      this.roles,
      this.isActive,
      this.partnerId,
      tenantId !== undefined ? tenantId : this.tenantId,
      branchId !== undefined ? branchId : this.branchId,
      this.avatar,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

}
