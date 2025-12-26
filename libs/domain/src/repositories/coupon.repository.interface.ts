import { Coupon } from '../entities/coupon.entity';

/**
 * Interfaz del repositorio de Coupon
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ICouponRepository {
  /**
   * Busca un cupón por su ID
   */
  findById(id: number): Promise<Coupon | null>;

  /**
   * Busca un cupón por su código
   */
  findByCode(code: string): Promise<Coupon | null>;

  /**
   * Busca cupones activos
   */
  findActive(): Promise<Coupon[]>;

  /**
   * Busca cupones válidos para una frecuencia específica
   */
  findValidByFrequency(
    frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual',
  ): Promise<Coupon[]>;

  /**
   * Guarda un nuevo cupón
   */
  save(coupon: Coupon): Promise<Coupon>;

  /**
   * Actualiza un cupón existente
   */
  update(coupon: Coupon): Promise<Coupon>;
}
