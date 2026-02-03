import { RateExchange } from '@libs/domain/entities/system/rate-exchange.entity';

/**
 * Interfaz del repositorio de tipo de cambio
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface IRateExchangeRepository {
  /**
   * Obtiene el tipo de cambio actual
   * Debe retornar el registro más reciente
   */
  getCurrent(): Promise<RateExchange | null>;

  /**
   * Actualiza o crea el tipo de cambio
   * Si existe un registro, lo actualiza; si no existe, crea uno nuevo
   */
  setRate(rate: number): Promise<RateExchange>;
}
