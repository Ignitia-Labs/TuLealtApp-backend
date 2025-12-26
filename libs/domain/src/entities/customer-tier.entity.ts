/**
 * Entidad de dominio CustomerTier
 * Representa un nivel/tier de cliente (Bronce, Plata, Oro, Platino)
 * No depende de frameworks ni librerías externas
 */
export class CustomerTier {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly minPoints: number,
    public readonly maxPoints: number | null, // null para el tier más alto (sin límite)
    public readonly color: string,
    public readonly benefits: string[],
    public readonly multiplier: number | null, // Multiplicador de puntos (ej: 1.05 = 5% bonus)
    public readonly priority: number, // Orden del tier (1 = más bajo, mayor número = más alto)
    public readonly status: 'active' | 'inactive',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo tier
   */
  static create(
    tenantId: number,
    name: string,
    description: string,
    minPoints: number,
    color: string,
    benefits: string[],
    priority: number,
    maxPoints: number | null = null,
    multiplier: number | null = null,
    status: 'active' | 'inactive' = 'active',
    id?: number,
  ): CustomerTier {
    const now = new Date();
    return new CustomerTier(
      id || 0,
      tenantId,
      name,
      description,
      minPoints,
      maxPoints,
      color,
      benefits,
      multiplier,
      priority,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si el tier está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para verificar si un usuario con ciertos puntos pertenece a este tier
   */
  belongsToTier(userPoints: number): boolean {
    if (!this.isActive()) {
      return false;
    }
    if (userPoints < this.minPoints) {
      return false;
    }
    if (this.maxPoints !== null && userPoints > this.maxPoints) {
      return false;
    }
    return true;
  }

  /**
   * Método de dominio para calcular puntos con el multiplicador del tier
   */
  applyMultiplier(basePoints: number): number {
    if (this.multiplier === null) {
      return basePoints;
    }
    return Math.floor(basePoints * this.multiplier);
  }

  /**
   * Método de dominio para verificar si es el tier más alto (sin límite máximo)
   */
  isHighestTier(): boolean {
    return this.maxPoints === null;
  }
}

