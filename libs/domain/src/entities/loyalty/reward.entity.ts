/**
 * Entidad de dominio Reward
 * Representa una recompensa canjeable que los clientes pueden obtener con puntos
 * No depende de frameworks ni librerías externas
 */
export type RewardStatus = 'active' | 'inactive' | 'draft' | 'expired';

export class Reward {
  constructor(
    public readonly id: number,
    public readonly tenantId: number,
    public readonly name: string,
    public readonly description: string | null,
    public readonly image: string | null,
    public readonly pointsRequired: number,
    public readonly stock: number,
    public readonly maxRedemptionsPerUser: number | null,
    public readonly status: RewardStatus,
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
    pointsRequired: number,
    stock: number,
    category: string,
    description: string | null = null,
    image: string | null = null,
    maxRedemptionsPerUser: number | null = null,
    status: RewardStatus = 'draft',
    terms: string | null = null,
    validUntil: Date | null = null,
    id?: number,
  ): Reward {
    // Validaciones de dominio
    if (pointsRequired <= 0) {
      throw new Error('pointsRequired must be greater than 0');
    }
    if (stock < -1) {
      throw new Error('stock must be -1 (unlimited) or greater than or equal to 0');
    }
    if (maxRedemptionsPerUser !== null && maxRedemptionsPerUser <= 0) {
      throw new Error('maxRedemptionsPerUser must be greater than 0 if provided');
    }
    if (!name || name.trim().length === 0) {
      throw new Error('name is required');
    }
    if (!category || category.trim().length === 0) {
      throw new Error('category is required');
    }

    return new Reward(
      id || 0,
      tenantId,
      name.trim(),
      description?.trim() || null,
      image?.trim() || null,
      pointsRequired,
      stock,
      maxRedemptionsPerUser,
      status,
      category.trim(),
      terms?.trim() || null,
      validUntil,
      id ? new Date() : new Date(),
      new Date(),
    );
  }

  /**
   * Verifica si la recompensa está disponible para canje
   * stock === -1 significa stock ilimitado (siempre disponible)
   */
  isAvailable(): boolean {
    if (this.status !== 'active') {
      return false;
    }
    // stock === -1 significa ilimitado, siempre disponible
    if (this.stock !== -1 && this.stock <= 0) {
      return false;
    }
    // validUntil === null significa válida de forma perpetua
    if (this.validUntil && new Date() > this.validUntil) {
      return false;
    }
    return true;
  }

  /**
   * Verifica si un usuario puede canjear esta recompensa
   * @param userRedemptions Número de veces que el usuario ya ha canjeado esta recompensa
   * @param userBalance Balance actual de puntos del usuario
   */
  canRedeem(userRedemptions: number, userBalance: number): boolean {
    if (!this.isAvailable()) {
      return false;
    }
    if (userBalance < this.pointsRequired) {
      return false;
    }
    if (this.maxRedemptionsPerUser !== null && userRedemptions >= this.maxRedemptionsPerUser) {
      return false;
    }
    return true;
  }

  /**
   * Reduce el stock en 1 (inmutable)
   * No hace nada si stock === -1 (ilimitado)
   */
  reduceStock(): Reward {
    // stock === -1 significa ilimitado, no se reduce
    if (this.stock === -1) {
      return this;
    }
    if (this.stock <= 0) {
      throw new Error('Cannot reduce stock: already at 0');
    }
    return new Reward(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.image,
      this.pointsRequired,
      this.stock - 1,
      this.maxRedemptionsPerUser,
      this.status,
      this.category,
      this.terms,
      this.validUntil,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Aumenta el stock en una cantidad específica (inmutable)
   * Si stock === -1 (ilimitado), permanece ilimitado
   */
  increaseStock(amount: number): Reward {
    if (amount <= 0) {
      throw new Error('amount must be greater than 0');
    }
    // Si stock es ilimitado (-1), permanece ilimitado
    if (this.stock === -1) {
      return this;
    }
    return new Reward(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.image,
      this.pointsRequired,
      this.stock + amount,
      this.maxRedemptionsPerUser,
      this.status,
      this.category,
      this.terms,
      this.validUntil,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Activa la recompensa
   */
  activate(): Reward {
    return new Reward(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.image,
      this.pointsRequired,
      this.stock,
      this.maxRedemptionsPerUser,
      'active',
      this.category,
      this.terms,
      this.validUntil,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Desactiva la recompensa
   */
  deactivate(): Reward {
    return new Reward(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.image,
      this.pointsRequired,
      this.stock,
      this.maxRedemptionsPerUser,
      'inactive',
      this.category,
      this.terms,
      this.validUntil,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Actualiza los puntos requeridos (inmutable)
   */
  updatePointsRequired(pointsRequired: number): Reward {
    if (pointsRequired <= 0) {
      throw new Error('pointsRequired must be greater than 0');
    }
    return new Reward(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.image,
      pointsRequired,
      this.stock,
      this.maxRedemptionsPerUser,
      this.status,
      this.category,
      this.terms,
      this.validUntil,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Verifica si la recompensa ha expirado
   */
  isExpired(): boolean {
    if (!this.validUntil) {
      return false;
    }
    return new Date() > this.validUntil;
  }
}
