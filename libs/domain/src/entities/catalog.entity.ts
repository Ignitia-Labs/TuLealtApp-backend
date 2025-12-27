/**
 * Entidad de dominio Catalog
 * Representa un elemento de catálogo configurable del sistema
 * No depende de frameworks ni librerías externas
 */
export type CatalogType = 'BUSINESS_CATEGORIES' | 'REWARD_TYPES' | 'PAYMENT_METHODS';

export class Catalog {
  constructor(
    public readonly id: number,
    public readonly type: CatalogType,
    public readonly value: string,
    public readonly slug: string,
    public readonly displayOrder: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo elemento de catálogo
   * El ID es opcional porque será generado automáticamente por la base de datos
   * Si no se proporciona slug, se generará automáticamente desde el value
   */
  static create(
    type: CatalogType,
    value: string,
    slug?: string,
    displayOrder: number = 0,
    isActive: boolean = true,
    id?: number,
  ): Catalog {
    const now = new Date();
    // Si no se proporciona slug, generar uno desde el value
    // Esto se manejará en la capa de aplicación usando la utilidad de slug
    const catalogSlug = slug || value.toLowerCase().trim();
    return new Catalog(id || 0, type, value, catalogSlug, displayOrder, isActive, now, now);
  }

  /**
   * Método de dominio para verificar si el elemento está activo
   */
  isCatalogActive(): boolean {
    return this.isActive;
  }

  /**
   * Método de dominio para activar el elemento
   */
  activate(): Catalog {
    return new Catalog(
      this.id,
      this.type,
      this.value,
      this.slug,
      this.displayOrder,
      true,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar el elemento
   */
  deactivate(): Catalog {
    return new Catalog(
      this.id,
      this.type,
      this.value,
      this.slug,
      this.displayOrder,
      false,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar el valor
   */
  updateValue(newValue: string, newSlug?: string): Catalog {
    return new Catalog(
      this.id,
      this.type,
      newValue,
      newSlug || this.slug,
      this.displayOrder,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para actualizar el orden de visualización
   */
  updateDisplayOrder(newOrder: number): Catalog {
    return new Catalog(
      this.id,
      this.type,
      this.value,
      this.slug,
      newOrder,
      this.isActive,
      this.createdAt,
      new Date(),
    );
  }
}
