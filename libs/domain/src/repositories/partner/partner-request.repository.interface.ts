import { PartnerRequest } from '@libs/domain/entities/partner/partner-request.entity';

/**
 * Interfaz del repositorio de PartnerRequest
 * Define el contrato que debe cumplir cualquier implementación
 */
export interface IPartnerRequestRepository {
  /**
   * Busca una solicitud por su ID
   */
  findById(id: number): Promise<PartnerRequest | null>;

  /**
   * Busca todas las solicitudes
   */
  findAll(skip?: number, take?: number): Promise<PartnerRequest[]>;

  /**
   * Busca solicitudes por estado
   */
  findByStatus(
    status: 'pending' | 'in-progress' | 'enrolled' | 'rejected',
  ): Promise<PartnerRequest[]>;

  /**
   * Busca solicitudes pendientes
   */
  findPending(): Promise<PartnerRequest[]>;

  /**
   * Guarda una nueva solicitud
   */
  save(request: PartnerRequest): Promise<PartnerRequest>;

  /**
   * Actualiza una solicitud existente
   */
  update(request: PartnerRequest): Promise<PartnerRequest>;

  /**
   * Elimina una solicitud por su ID
   */
  delete(id: number): Promise<void>;
}
