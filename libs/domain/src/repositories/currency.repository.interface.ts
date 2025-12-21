import { Currency } from '../entities/currency.entity';

/**
 * Interfaz del repositorio de Currency
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface ICurrencyRepository {
  /**
   * Guarda una nueva moneda o actualiza una existente
   */
  save(currency: Currency): Promise<Currency>;

  /**
   * Busca una moneda por su ID
   */
  findById(id: number): Promise<Currency | null>;

  /**
   * Busca una moneda por su código ISO
   */
  findByCode(code: string): Promise<Currency | null>;

  /**
   * Obtiene todas las monedas activas
   */
  findAllActive(): Promise<Currency[]>;

  /**
   * Obtiene todas las monedas
   */
  findAll(): Promise<Currency[]>;
}

