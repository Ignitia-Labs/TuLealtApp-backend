/**
 * Entidad de dominio Currency
 * Representa una moneda en el dominio de negocio
 * No depende de frameworks ni librerías externas
 */
export class Currency {
  constructor(
    public readonly id: number,
    public readonly code: string, // Código ISO de 3 letras (ej: USD, GTQ)
    public readonly name: string, // Nombre completo de la moneda
    public readonly symbol: string, // Símbolo de la moneda (ej: $, €)
    public readonly symbolPosition: 'before' | 'after', // Posición del símbolo
    public readonly decimalPlaces: number, // Número de decimales
    public readonly status: 'active' | 'inactive',
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear una nueva moneda
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    code: string,
    name: string,
    symbol: string,
    symbolPosition: 'before' | 'after',
    decimalPlaces: number,
    status: 'active' | 'inactive' = 'active',
    id?: number,
  ): Currency {
    const now = new Date();
    return new Currency(
      id || 0,
      code,
      name,
      symbol,
      symbolPosition,
      decimalPlaces,
      status,
      now,
      now,
    );
  }

  /**
   * Método de dominio para verificar si la moneda está activa
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Método de dominio para activar la moneda
   */
  activate(): Currency {
    return new Currency(
      this.id,
      this.code,
      this.name,
      this.symbol,
      this.symbolPosition,
      this.decimalPlaces,
      'active',
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Método de dominio para desactivar la moneda
   */
  deactivate(): Currency {
    return new Currency(
      this.id,
      this.code,
      this.name,
      this.symbol,
      this.symbolPosition,
      this.decimalPlaces,
      'inactive',
      this.createdAt,
      new Date(),
    );
  }
}
