import { Commission, CommissionStatus } from '../entities/commission.entity';

/**
 * Filtros para búsqueda de comisiones
 */
export interface CommissionFilters {
  status?: CommissionStatus;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

/**
 * Interfaz del repositorio de comisiones
 * Define los métodos que debe implementar cualquier repositorio de comisiones
 */
export interface ICommissionRepository {
  /**
   * Buscar una comisión por ID
   */
  findById(id: number): Promise<Commission | null>;

  /**
   * Buscar todas las comisiones de un pago
   */
  findByPaymentId(paymentId: number): Promise<Commission[]>;

  /**
   * Buscar todas las comisiones de un usuario staff
   */
  findByStaffUserId(
    staffUserId: number,
    filters?: CommissionFilters,
  ): Promise<Commission[]>;

  /**
   * Buscar todas las comisiones de un partner
   */
  findByPartnerId(
    partnerId: number,
    filters?: CommissionFilters,
  ): Promise<Commission[]>;

  /**
   * Guardar una nueva comisión
   */
  save(commission: Commission): Promise<Commission>;

  /**
   * Guardar múltiples comisiones
   */
  saveMany(commissions: Commission[]): Promise<Commission[]>;

  /**
   * Actualizar una comisión existente
   */
  update(commission: Commission): Promise<Commission>;

  /**
   * Eliminar una comisión
   */
  delete(id: number): Promise<void>;

  /**
   * Obtener el total de comisiones (monto) por staff
   */
  getTotalCommissionsByStaff(
    staffUserId: number,
    startDate?: Date,
    endDate?: Date,
    status?: CommissionStatus,
  ): Promise<number>;

  /**
   * Obtener el total de comisiones (monto) por partner
   */
  getTotalCommissionsByPartner(
    partnerId: number,
    startDate?: Date,
    endDate?: Date,
    status?: CommissionStatus,
  ): Promise<number>;

  /**
   * Contar comisiones por staff con filtros
   */
  countByStaffUserId(
    staffUserId: number,
    filters?: CommissionFilters,
  ): Promise<number>;

  /**
   * Contar comisiones por partner con filtros
   */
  countByPartnerId(
    partnerId: number,
    filters?: CommissionFilters,
  ): Promise<number>;
}

