/**
 * Entidad de dominio User
 * Representa un usuario en el dominio de negocio
 * No depende de frameworks ni librerías externas
 */
export class User {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly roles: string[],
    public readonly isActive: boolean,
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
    passwordHash: string,
    roles: string[] = ['customer'],
    id?: number,
  ): User {
    const now = new Date();
    return new User(id || 0, email, name, passwordHash, roles, true, now, now);
  }

  /**
   * Método de dominio para verificar si el usuario está activo
   */
  isActiveUser(): boolean {
    return this.isActive;
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
      this.passwordHash,
      this.roles,
      false,
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
      this.passwordHash,
      this.roles,
      true,
      this.createdAt,
      new Date(),
    );
  }
}
