/**
 * Entidad de dominio TierStatus
 * Representa el estado actual del tier de un membership
 * Rastrea el tier actual, cuándo se asignó, y cuándo se evaluará nuevamente
 * No depende de frameworks ni librerías externas
 */

export class TierStatus {
  constructor(
    public readonly membershipId: number,
    public readonly currentTierId: number | null, // null = sin tier asignado
    public readonly since: Date, // Fecha desde cuando está en este tier
    public readonly graceUntil: Date | null, // Fecha hasta cuando está en grace period (null = no aplica)
    public readonly nextEvalAt: Date | null, // Fecha de próxima evaluación (null = no programada)
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo estado de tier
   */
  static create(
    membershipId: number,
    currentTierId: number | null = null,
    since: Date = new Date(),
    graceUntil: Date | null = null,
    nextEvalAt: Date | null = null,
  ): TierStatus {
    const now = new Date();

    // Validaciones de dominio
    if (graceUntil && graceUntil < since) {
      throw new Error('Grace period end date must be after start date');
    }

    if (nextEvalAt && nextEvalAt < now) {
      throw new Error('Next evaluation date must be in the future');
    }

    return new TierStatus(membershipId, currentTierId, since, graceUntil, nextEvalAt, now, now);
  }

  /**
   * Método de dominio para verificar si está en grace period
   */
  isInGracePeriod(now: Date = new Date()): boolean {
    if (!this.graceUntil) {
      return false;
    }
    return now <= this.graceUntil;
  }

  /**
   * Método de dominio para crear un nuevo estado con upgrade
   */
  upgrade(
    newTierId: number,
    graceUntil: Date | null = null,
    nextEvalAt: Date | null = null,
  ): TierStatus {
    if (this.currentTierId === newTierId) {
      return this; // Ya está en ese tier
    }

    return new TierStatus(
      this.membershipId,
      newTierId,
      new Date(), // Nueva fecha de inicio
      graceUntil,
      nextEvalAt,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Método de dominio para crear un nuevo estado con downgrade
   */
  downgrade(
    newTierId: number | null,
    graceUntil: Date | null = null,
    nextEvalAt: Date | null = null,
  ): TierStatus {
    if (this.currentTierId === newTierId) {
      return this; // Ya está en ese tier
    }

    return new TierStatus(
      this.membershipId,
      newTierId,
      new Date(), // Nueva fecha de inicio
      graceUntil,
      nextEvalAt,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Método de dominio para actualizar la fecha de próxima evaluación
   */
  updateNextEvalAt(nextEvalAt: Date | null): TierStatus {
    if (nextEvalAt && nextEvalAt < new Date()) {
      throw new Error('Next evaluation date must be in the future');
    }

    return new TierStatus(
      this.membershipId,
      this.currentTierId,
      this.since,
      this.graceUntil,
      nextEvalAt,
      this.createdAt,
      new Date(), // updatedAt
    );
  }

  /**
   * Método de dominio para verificar si tiene tier asignado
   */
  hasTier(): boolean {
    return this.currentTierId !== null;
  }

  /**
   * Método de dominio para calcular días en el tier actual
   */
  daysInCurrentTier(now: Date = new Date()): number {
    const diffTime = now.getTime() - this.since.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
