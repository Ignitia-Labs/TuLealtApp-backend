/**
 * Entidad de dominio UserPermission
 * Representa la asignación directa de un permiso a un usuario
 * No depende de frameworks ni librerías externas
 */
export class UserPermission {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly permissionId: number,
    public readonly assignedBy: number, // userId que asignó el permiso
    public readonly assignedAt: Date,
    public readonly isActive: boolean,
  ) {}

  /**
   * Factory method para crear una nueva asignación de permiso a usuario
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    userId: number,
    permissionId: number,
    assignedBy: number,
    isActive: boolean = true,
    id?: number,
  ): UserPermission {
    if (!userId || userId <= 0) {
      throw new Error('User ID is required and must be greater than 0');
    }

    if (!permissionId || permissionId <= 0) {
      throw new Error('Permission ID is required and must be greater than 0');
    }

    if (!assignedBy || assignedBy <= 0) {
      throw new Error('AssignedBy user ID is required and must be greater than 0');
    }

    const now = new Date();
    return new UserPermission(id || 0, userId, permissionId, assignedBy, now, isActive);
  }

  /**
   * Método de dominio para desactivar la asignación (soft delete)
   * Retorna una nueva instancia de la asignación desactivada
   */
  deactivate(): UserPermission {
    return new UserPermission(
      this.id,
      this.userId,
      this.permissionId,
      this.assignedBy,
      this.assignedAt,
      false,
    );
  }

  /**
   * Método de dominio para activar la asignación
   * Retorna una nueva instancia de la asignación activada
   */
  activate(): UserPermission {
    return new UserPermission(
      this.id,
      this.userId,
      this.permissionId,
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

