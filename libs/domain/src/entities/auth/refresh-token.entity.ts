/**
 * Entidad de dominio RefreshToken
 * Representa un token de refresco para mantener sesiones activas
 * No depende de frameworks ni librerías externas
 */
export class RefreshToken {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly tokenHash: string, // Hash del token (no el token en texto plano)
    public readonly expiresAt: Date,
    public readonly isRevoked: boolean,
    public readonly userAgent: string | null,
    public readonly ipAddress: string | null,
    public readonly createdAt: Date,
    public readonly revokedAt: Date | null,
  ) {}

  /**
   * Factory method para crear un nuevo refresh token
   * @param userId ID del usuario propietario del token
   * @param tokenHash Hash del token (debe ser hasheado antes de pasar)
   * @param expiresAt Fecha de expiración del token
   * @param userAgent User agent del navegador/cliente
   * @param ipAddress Dirección IP del cliente
   * @returns Nueva instancia de RefreshToken
   */
  static create(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    userAgent: string | null = null,
    ipAddress: string | null = null,
    id?: number,
  ): RefreshToken {
    if (!userId || userId <= 0) {
      throw new Error('userId must be a positive number');
    }

    if (!tokenHash || tokenHash.trim().length === 0) {
      throw new Error('tokenHash cannot be empty');
    }

    if (!expiresAt || expiresAt <= new Date()) {
      throw new Error('expiresAt must be a future date');
    }

    return new RefreshToken(
      id || 0, // ID será asignado por la BD
      userId,
      tokenHash,
      expiresAt,
      false, // Nuevo token no está revocado
      userAgent,
      ipAddress,
      new Date(),
      null, // No ha sido revocado aún
    );
  }

  /**
   * Método de dominio para verificar si el token ha expirado
   * @returns true si el token ha expirado
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Método de dominio para verificar si el token está activo
   * Un token está activo si no ha sido revocado y no ha expirado
   * @returns true si el token está activo
   */
  isActive(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  /**
   * Método de dominio para revocar el token
   * Retorna nueva instancia con el token revocado (inmutabilidad)
   * @returns Nueva instancia de RefreshToken revocado
   */
  revoke(): RefreshToken {
    if (this.isRevoked) {
      throw new Error('Token is already revoked');
    }

    return new RefreshToken(
      this.id,
      this.userId,
      this.tokenHash,
      this.expiresAt,
      true, // Marcar como revocado
      this.userAgent,
      this.ipAddress,
      this.createdAt,
      new Date(), // Timestamp de revocación
    );
  }

  /**
   * Método de dominio para verificar que el token pertenece a un usuario
   * @param userId ID del usuario a verificar
   * @returns true si el token pertenece al usuario
   */
  belongsToUser(userId: number): boolean {
    return this.userId === userId;
  }

  /**
   * Método de dominio para verificar tiempo de vida restante en minutos
   * @returns Minutos restantes de vida del token, 0 si está expirado
   */
  getRemainingLifetimeMinutes(): number {
    if (this.isExpired()) {
      return 0;
    }

    const now = new Date().getTime();
    const expiresAtTime = this.expiresAt.getTime();
    const diffMs = expiresAtTime - now;
    return Math.floor(diffMs / 60000); // Convertir a minutos
  }
}
