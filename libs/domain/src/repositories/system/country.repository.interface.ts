import { Country } from '@libs/domain/entities/system/country.entity';

/**
 * Interfaz del repositorio de Country
 * Define el contrato que debe cumplir cualquier implementación
 * La implementación concreta estará en la capa de infraestructura
 */
export interface ICountryRepository {
  /**
   * Guarda un nuevo país o actualiza uno existente
   */
  save(country: Country): Promise<Country>;

  /**
   * Busca un país por su ID
   */
  findById(id: number): Promise<Country | null>;

  /**
   * Busca un país por su código ISO (2 letras)
   */
  findByCode(code: string): Promise<Country | null>;

  /**
   * Busca países por código de moneda
   */
  findByCurrencyCode(currencyCode: string): Promise<Country[]>;

  /**
   * Obtiene todos los países activos
   */
  findAllActive(): Promise<Country[]>;

  /**
   * Obtiene todos los países
   */
  findAll(): Promise<Country[]>;
}
