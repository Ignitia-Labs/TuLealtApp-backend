/**
 * Entidad de dominio RateExchange
 * Representa el tipo de cambio entre Quetzales (GTQ) y Dólares (USD)
 * La moneda base es Quetzal, y almacena cuántos quetzales equivalen a 1 dólar
 * No depende de frameworks ni librerías externas
 */

export class RateExchange {
  constructor(
    public readonly id: number,
    public readonly rate: number, // GTQ por USD (ej: 8 significa 8 GTQ = 1 USD)
    public readonly fromCurrency: string, // Siempre 'GTQ'
    public readonly toCurrency: string, // Siempre 'USD'
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory method para crear un nuevo tipo de cambio
   * El ID es opcional porque será generado automáticamente por la base de datos
   */
  static create(
    rate: number,
    fromCurrency: string = 'GTQ',
    toCurrency: string = 'USD',
    id?: number,
  ): RateExchange {
    const now = new Date();
    return new RateExchange(id || 0, rate, fromCurrency, toCurrency, now, now);
  }

  /**
   * Método de dominio para convertir USD a GTQ
   */
  convertUsdToGtq(usdAmount: number): number {
    return usdAmount * this.rate;
  }

  /**
   * Método de dominio para convertir GTQ a USD
   */
  convertGtqToUsd(gtqAmount: number): number {
    return gtqAmount / this.rate;
  }

  /**
   * Método de dominio para actualizar el tipo de cambio
   */
  updateRate(newRate: number): RateExchange {
    return new RateExchange(
      this.id,
      newRate,
      this.fromCurrency,
      this.toCurrency,
      this.createdAt,
      new Date(),
    );
  }
}
