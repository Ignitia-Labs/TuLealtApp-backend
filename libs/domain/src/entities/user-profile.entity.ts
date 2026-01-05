/**
 * Entidad de dominio UserProfile
 * Representa la asignación de un perfil a un usuario
 * No depende de frameworks ni librerías externas
 */
export class UserProfile {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly profileId: number,
    public readonly assignedBy: number, // userId que asignó el perfil
    public readonly assignedAt: Date,
    public readonly isActive: boolean,
  ) {}

  /**
   * Factory method para crear una nueva asignación de perfil a usuario
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    userId: number,
    profileId: number,
    assignedBy: number,
    isActive: boolean = true,
    id?: number,
  ): UserProfile {
    const now = new Date();
    return new UserProfile(id || 0, userId, profileId, assignedBy, now, isActive);
  }

  /**
   * Método de dominio para desactivar la asignación (soft delete)
   * Retorna una nueva instancia de la asignación desactivada
   */
  deactivate(): UserProfile {
    return new UserProfile(
      this.id,
      this.userId,
      this.profileId,
      this.assignedBy,
      this.assignedAt,
      false,
    );
  }

  /**
   * Método de dominio para activar la asignación
   * Retorna una nueva instancia de la asignación activada
   */
  activate(): UserProfile {
    return new UserProfile(
      this.id,
      this.userId,
      this.profileId,
      this.assignedBy,
      this.assignedAt,
      true,
    );
  }

  /**
   * Método de dominio para verificar si la asignación está activa
   */
  isAssignmentActive(): boolean {
    return this.isActive;
  }
}
