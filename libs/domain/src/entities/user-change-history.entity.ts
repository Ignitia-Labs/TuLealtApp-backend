/**
 * Entidad de dominio para el historial de cambios de usuarios
 * Almacena un registro de cada cambio realizado en un usuario
 */
export class UserChangeHistory {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly changedBy: number,
    public readonly action: UserChangeAction,
    public readonly field: string | null,
    public readonly oldValue: string | null,
    public readonly newValue: string | null,
    public readonly metadata: Record<string, any> | null,
    public readonly createdAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo registro de historial
   */
  static create(
    userId: number,
    changedBy: number,
    action: UserChangeAction,
    field: string | null = null,
    oldValue: string | null = null,
    newValue: string | null = null,
    metadata: Record<string, any> | null = null,
    id?: number,
  ): UserChangeHistory {
    return new UserChangeHistory(
      id || 0,
      userId,
      changedBy,
      action,
      field,
      oldValue,
      newValue,
      metadata,
      new Date(),
    );
  }
}

/**
 * Tipos de acciones que se pueden registrar en el historial
 */
export type UserChangeAction =
  | 'created'
  | 'updated'
  | 'locked'
  | 'unlocked'
  | 'deleted'
  | 'profile_assigned'
  | 'profile_removed'
  | 'role_changed'
  | 'status_changed'
  | 'partner_assigned'
  | 'partner_removed';

