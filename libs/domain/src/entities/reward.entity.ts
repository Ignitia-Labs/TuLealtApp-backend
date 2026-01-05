/**
 * Entidad de dominio Reward
 * Representa una recompensa que los clientes pueden canjear con puntos
 * No depende de frameworks ni librerías externas
 */
export class Reward {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    public readonly description: string,
    public readonly image: string | null,
    public readonly pointsRequired: number,
    public readonly stock: number,
    public readonly maxRedemptionsPerUser: number | null,
    public readonly status: 'active' | 'inactive' | 'out_of_stock',
    public readonly category: string,
    public readonly terms: string | null,
    public readonly validUntil: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva recompensa
   */
  static create(
    tenantId: number,
    name: string,
    description: string,
    pointsRequired: number,
    stock: number,
    category: string,
    image: string | null = null,
    maxRedemptionsPerUser: number | null = null,
    terms: string | null = null,
    validUntil: Date | null = null,
    status: 'active' | 'inactive' | 'out_of_stock' = 'active',
    id?: number,
  ): Reward {
    const now = new Date();
    return new Reward(
      id || 0,
      tenantId,
      name,
      description,
      image,
      pointsRequired,
      stock,
      maxRedemptionsPerUser,
      status,
      category,
      terms,
      validUntil,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la recompensa está disponible
   */
  isAvailable(): boolean {
    return this.status === 'active' && (this.stock > 0 || this.stock === -1);
  }

  /**
   * Método de dominio para verificar si la recompensa está vencida
   */
  isExpired(): boolean {
    return this.validUntil !== null && this.validUntil < new Date();
  }

  /**
   * Método de dominio para verificar si un usuario puede canjear esta recompensa
   */
  canRedeem(userPoints: number, userRedemptionsCount: number = 0): boolean {
    if (!this.isAvailable() || this.isExpired()) {
      return false;
    }
    if (userPoints < this.pointsRequired) {
      return false;
    }
    if (this.maxRedemptionsPerUser !== null && userRedemptionsCount >= this.maxRedemptionsPerUser) {
      return false;
    }
    return true;
  }

  /**
   * Método de dominio para reducir el stock después de un canje
   */
  reduceStock(amount: number = 1): Reward {
    const newStock = this.stock === -1 ? -1 : Math.max(0, this.stock - amount);
    const newStatus = newStock === 0 && this.stock !== -1 ? 'out_of_stock' : this.status;
    return new Reward(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.image,
      this.pointsRequired,
      newStock,
      this.maxRedemptionsPerUser,
      newStatus,
      this.category,
      this.terms,
      this.validUntil,
      this.createdAt,
      new Date(),
    );
  }
}
