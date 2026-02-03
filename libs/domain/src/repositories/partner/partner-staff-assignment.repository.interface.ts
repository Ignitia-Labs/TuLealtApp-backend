import { PartnerStaffAssignment } from '@libs/domain/entities/partner/partner-staff-assignment.entity';

/**
 * Interfaz del repositorio de asignaciones staff-partner
 * Define los métodos que debe implementar cualquier repositorio de asignaciones
 */
export interface IPartnerStaffAssignmentRepository {
  /**
   * Buscar una asignación por ID
   */
  findById(id: number): Promise<PartnerStaffAssignment | null>;

  /**
   * Buscar todas las asignaciones de un partner
   */
  findByPartnerId(partnerId: number, activeOnly?: boolean): Promise<PartnerStaffAssignment[]>;

  /**
   * Buscar todas las asignaciones de un usuario staff
   */
  findByStaffUserId(staffUserId: number, activeOnly?: boolean): Promise<PartnerStaffAssignment[]>;

  /**
   * Buscar una asignación específica por partner y staff
   */
  findByPartnerAndStaff(
    partnerId: number,
    staffUserId: number,
  ): Promise<PartnerStaffAssignment | null>;

  /**
   * Buscar todas las asignaciones
   */
  findAll(activeOnly?: boolean): Promise<PartnerStaffAssignment[]>;

  /**
   * Guardar una nueva asignación
   */
  save(assignment: PartnerStaffAssignment): Promise<PartnerStaffAssignment>;

  /**
   * Actualizar una asignación existente
   */
  update(assignment: PartnerStaffAssignment): Promise<PartnerStaffAssignment>;

  /**
   * Eliminar una asignación
   */
  delete(id: number): Promise<void>;

  /**
   * Obtener la suma total de porcentajes de comisión para un partner
   * Útil para validar que no se exceda el 100%
   */
  getTotalCommissionPercent(partnerId: number, excludeId?: number): Promise<number>;

  /**
   * Buscar asignaciones activas para un partner en una fecha específica
   * Útil para calcular comisiones basadas en el estado de las asignaciones al momento del pago
   */
  findActiveAssignmentsByDate(partnerId: number, date: Date): Promise<PartnerStaffAssignment[]>;
}
