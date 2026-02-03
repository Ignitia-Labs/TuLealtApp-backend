/**
 * Entidad de dominio ProfilePermission
 * Representa la relación many-to-many entre un perfil y un permiso
 * No depende de frameworks ni librerías externas
 */
export class ProfilePermission {
  constructor(
    public readonly id: number,
    public readonly profileId: number,
    public readonly permissionId: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva relación perfil-permiso
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(profileId: number, permissionId: number, id?: number): ProfilePermission {
    if (!profileId || profileId <= 0) {
      throw new Error('Profile ID is required and must be greater than 0');
    }

    if (!permissionId || permissionId <= 0) {
      throw new Error('Permission ID is required and must be greater than 0');
    }

    const now = new Date();
    return new ProfilePermission(id || 0, profileId, permissionId, now, now);
  }
}
