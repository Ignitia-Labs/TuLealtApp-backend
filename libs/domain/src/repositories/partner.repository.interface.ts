import { Partner } from '../entities/partner.entity';

/**
 * Interfaz del repositorio de Partner
 * Define los contratos para persistir y recuperar partners
 */
export interface IPartnerRepository {
  /**
   * Guarda un nuevo partner o actualiza uno existente
   */
  save(partner: Partner): Promise<Partner>;

  /**
   * Actualiza un partner existente
   */
  update(partner: Partner): Promise<Partner>;

  /**
   * Busca un partner por su ID
   */
  findById(id: number): Promise<Partner | null>;

  /**
   * Busca un partner por su email
   */
  findByEmail(email: string): Promise<Partner | null>;

  /**
   * Busca un partner por su dominio
   */
  findByDomain(domain: string): Promise<Partner | null>;

  /**
   * Obtiene todos los partners
   */
  findAll(): Promise<Partner[]>;

  /**
   * Actualiza las estadísticas del partner basándose en los datos reales de la base de datos
   */
  updateStats(partnerId: number): Promise<void>;

  /**
   * Elimina un partner por su ID
   */
  delete(id: number): Promise<void>;
}
