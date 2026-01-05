/**
 * Entidad de dominio Country
 * Representa un país en el dominio de negocio
 * No depende de frameworks ni librerías externas
 */
export class Country {
  constructor(
    public readonly id: number,
    public readonly name: string, // Nombre del país (ej: "Estados Unidos", "Guatemala")
    public readonly code: string | null, // Código ISO de 2 letras (ej: "US", "GT") - opcional
    public readonly currencyCode: string, // Código ISO de 3 letras de la moneda (ej: "USD", "GTQ")
    public readonly status: 'active' | 'inactive',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo país
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    name: string,
    currencyCode: string,
    code: string | null = null,
    status: 'active' | 'inactive' = 'active',
    id?: number,
  ): Country {
    const now = new Date();
    return new Country(id || 0, name, code, currencyCode, status, now, now);
  }

  /**
   * Método de dominio para verificar si el país está activo
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para activar el país
   */
  activate(): Country {
    return new Country(
      this.id,
      this.name,
      this.code,
      this.currencyCode,
      'active',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar el país
   */
  deactivate(): Country {
    return new Country(
      this.id,
      this.name,
      this.code,
      this.currencyCode,
      'inactive',
      this.createdAt,
      new Date(),
    );
  }
}
