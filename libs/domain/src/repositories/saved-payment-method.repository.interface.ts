import { SavedPaymentMethod } from '../entities/saved-payment-method.entity';

/**
 * Interfaz del repositorio de SavedPaymentMethod
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface ISavedPaymentMethodRepository {
  /**
   * Busca un método de pago por su ID
   */
  findById(id: number): Promise<SavedPaymentMethod | null>;

  /**
   * Busca todos los métodos de pago de un partner
   */
  findByPartnerId(partnerId: number): Promise<SavedPaymentMethod[]>;

  /**
   * Busca métodos de pago activos de un partner
   */
  findActiveByPartnerId(partnerId: number): Promise<SavedPaymentMethod[]>;

  /**
   * Busca el método de pago por defecto de un partner
   */
  findDefaultByPartnerId(partnerId: number): Promise<SavedPaymentMethod | null>;

  /**
   * Guarda un nuevo método de pago
   */
  save(method: SavedPaymentMethod): Promise<SavedPaymentMethod>;

  /**
   * Actualiza un método de pago existente
   */
  update(method: SavedPaymentMethod): Promise<SavedPaymentMethod>;

  /**
   * Elimina un método de pago por su ID
   */
  delete(id: number): Promise<void>;
}
